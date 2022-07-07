/*
    TinyDTLS Proxy Server
    Note that this proxy is single threaded since tinydtls allows only one thread.

   References

   - http://tinydtls.sourceforge.net/group__dtls__usage.html
   - https://github.com/namib-project/tinydtls-rs/blob/main/tinydtls-sys/src/lib.rs
*/

#![feature(core_ffi_c, c_size_t)]
#![allow(improper_ctypes_definitions)]

pub mod psk_key;

use cbor::{self, Decoder, Encoder};
use coap_lite::Packet;
use core::ffi::c_int;
use libc::{in6_addr, sockaddr, sockaddr_in6, socklen_t, AF_INET6};
use std::{
    ffi::c_void,
    io,
    net::{Ipv6Addr, SocketAddr, SocketAddrV6, UdpSocket},
    time::Duration,
};

use tinydtls_sys::*;

use crate::psk_key::PSK_KEY;
const PSK_DEFAULT_IDENTITY: &str = "default";

const PREFIX: &'static str = "[LWPROXY]";
const MAX_SESSIONS: u64 = 16;

macro_rules! debug_fmt {
    ($s:expr) => {
        format!("{} {}", PREFIX, $s).as_str()
    };
}

macro_rules! debug_println {
    ($s:expr) => {
        println!("{}", debug_fmt!($s));
    };
}

fn get_ipv6_from_peer(peer: SocketAddr) -> sockaddr_in6 {
    match peer {
        SocketAddr::V4(_) => {
            // Outer functions guarantee that this will not happen in this context.
            debug_println!("Non-IPv6 peer");
            panic!();
        }
        SocketAddr::V6(addr) => {
            sockaddr_in6 {
                sin6_addr: in6_addr {
                    s6_addr: addr.ip().octets(),
                },
                sin6_family: AF_INET6 as u16,
                sin6_flowinfo: addr.flowinfo(),
                sin6_port: addr.port().to_be(), // Standard network byte order
                sin6_scope_id: addr.scope_id(),
            }
        }
    }
}

unsafe extern "C" fn server_write_callback(
    ctx: *mut dtls_context_t,
    session: *mut session_t,
    buf: *mut u8,
    len: usize,
) -> i32 {
    debug_println!("WRITE");

    let socket = (*ctx).app as *mut UdpSocket;
    let addr = session.as_ref().unwrap().addr.sin6.as_ref();

    assert!(addr.sin6_family == AF_INET6 as u16);

    (*socket)
        .send_to(
            std::slice::from_raw_parts(buf, len as usize),
            SocketAddrV6::new(
                Ipv6Addr::from(addr.sin6_addr.s6_addr),
                u16::from_be(addr.sin6_port),
                addr.sin6_flowinfo,
                addr.sin6_scope_id,
            ),
        )
        .expect(debug_fmt!("Failed to send message"));

    0
}

unsafe extern "C" fn server_read_callback(
    _ctx: *mut dtls_context_t,
    _session: *mut session_t,
    buf: *mut u8,
    len: usize,
) -> i32 {
    let backend = UdpSocket::bind("::1:5685").expect(debug_fmt!("Could not bind socket"));
    backend
        .connect("::1:5683")
        .expect(debug_fmt!("Could not connect socket"));
    backend
        .send(std::slice::from_raw_parts(buf, len as usize))
        .expect(debug_fmt!("Could not send data to backend"));
    debug_println!("Forwarded message to backend.");

    0
}

unsafe extern "C" fn server_event_callback(
    _ctx: *mut dtls_context_t,
    _session: *mut session_t,
    level: dtls_alert_level_t,
    code: u16,
) -> i32 {
    debug_println!(format!(
        "EVENT - LEVEL: {} - CODE: {}",
        match level {
            dtls_alert_level_t::DTLS_ALERT_LEVEL_FATAL => {
                "FATAL"
            }
            dtls_alert_level_t::DTLS_ALERT_LEVEL_WARNING => {
                "WARNING"
            }
            _ => {
                panic!()
            }
        },
        code
    ));

    0
}

unsafe extern "C" fn server_get_psk_info(
    _ctx: *mut dtls_context_t,
    _session: *const session_t,
    cred_type: dtls_credentials_type_t,
    _id: *const u8,
    _id_len: usize,
    result: *mut u8,
    result_length: usize,
) -> i32 {
    debug_println!("PSK");

    match cred_type {
        // See also the `fw`.
        dtls_credentials_type_t::DTLS_PSK_HINT => 0,
        dtls_credentials_type_t::DTLS_PSK_IDENTITY => {
            result.copy_from(
                PSK_DEFAULT_IDENTITY.as_bytes().as_ptr(),
                PSK_DEFAULT_IDENTITY.len(),
            );
            PSK_DEFAULT_IDENTITY.len() as i32
        }
        dtls_credentials_type_t::DTLS_PSK_KEY => {
            // TODO: Maybe optimize this dirty copy, not many bits, however.
            assert!(PSK_KEY.len() <= result_length);
            std::slice::from_raw_parts_mut(result, result_length).copy_from_slice(PSK_KEY.as_ref());
            PSK_KEY.len() as i32
        }
        _ => {
            panic!()
        }
    }
}

fn main() {
    let mut dtls_socket = UdpSocket::bind(":::5684").expect(debug_fmt!("Could not bind socket"));
    let mut backend_socket = UdpSocket::bind(":::5685").expect(debug_fmt!("Could not bind socket"));
    dtls_socket
        .set_nonblocking(true)
        .expect(debug_fmt!("Could not enable nonblocking mode"));
    backend_socket
        .set_nonblocking(true)
        .expect(debug_fmt!("Could not enable nonblocking mode"));

    let mut handlers = dtls_handler_t {
        event: Some(server_event_callback),
        write: Some(server_write_callback),
        read: Some(server_read_callback),
        get_psk_info: Some(server_get_psk_info),
        get_ecdsa_key: None,
        verify_ecdsa_key: None,
    };
    let context: *mut dtls_context_t =
        unsafe { dtls_new_context(&mut dtls_socket as *mut UdpSocket as *mut c_void) };
    assert!(!context.is_null());
    unsafe { dtls_set_handler(context, &mut handlers) };

    let mut buf: [u8; 1024] = [0; 1024];
    let mut sessions: Vec<*mut session_t> = Vec::new();
    loop {
        // TODO: Make this async for more clarity.
        buf = [0; 1024]; // Clear buffer
        std::thread::sleep(Duration::from_millis(16));
        // Receive DTLS
        match dtls_socket.recv_from(&mut buf) {
            Ok((size, peer)) => {
                let mut addr: sockaddr_in6 = get_ipv6_from_peer(peer);

                let mut session_index = usize::MAX;
                unsafe {
                    for i in 0..sessions.len() {
                        if addr.sin6_addr.s6_addr
                            == (*sessions[i]).addr.sin6.as_ref().sin6_addr.s6_addr
                        {
                            session_index = i;
                        }
                    }
                }

                if session_index == usize::MAX {
                    unsafe {
                        if sessions.len() == MAX_SESSIONS as usize {
                            debug_println!(
                                "Cannot create new sessions (sessions.len() == MAX_SESSIONS)"
                            );
                            continue;
                        } else {
                            let session = dtls_new_session(
                                &mut addr as *mut sockaddr_in6 as *mut sockaddr,
                                std::mem::size_of::<sockaddr_in6>() as socklen_t,
                            );
                            assert!(!session.is_null());
                            sessions.push(session);
                            debug_println!(format!(
                                "Created session, session count: {}",
                                sessions.len()
                            ));
                            session_index = sessions.len() - 1;
                        }
                    }
                }

                unsafe {
                    dtls_handle_message(
                        context,
                        sessions[session_index],
                        buf.as_mut_ptr(),
                        size as c_int,
                    );
                }
            }
            Err(e) => {
                if e.kind() == io::ErrorKind::WouldBlock {
                    continue;
                } else {
                    debug_println!("Failed to receive message");
                    continue;
                }
            }
        }
        buf = [0; 1024];
        // Receive UDP
        match backend_socket.recv_from(&mut buf) {
            Ok((_size, _peer)) => match Packet::from_bytes(buf.as_ref()) {
                Ok(pkt) => {
                    let mut dec = Decoder::from_bytes(pkt.payload);
                    let items = match dec.items().collect::<Result<Vec<_>, _>>() {
                        Ok(result) => result,
                        Err(_) => {
                            debug_println!("Malformed CBOR packet");
                            continue;
                        }
                    };
                    debug_println!(format!("{}", items.len()));
                }
                Err(_) => {
                    debug_println!("Non-CBOR payload");
                    continue;
                }
            },
            Err(e) => {
                if e.kind() == io::ErrorKind::WouldBlock {
                    continue;
                } else {
                    debug_println!("Failed to receive message");
                    continue;
                }
            }
        }
    }
}
