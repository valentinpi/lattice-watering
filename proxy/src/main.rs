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

use cbor_event::{de::Deserializer, se::Serializer};
use coap_lite::Packet;
use core::ffi::c_int;
use libc::{in6_addr, sockaddr, sockaddr_in6, socklen_t, AF_INET6};
use std::{
    ffi::c_void,
    io::{self, Cursor},
    net::{Ipv6Addr, SocketAddr, SocketAddrV6, UdpSocket},
    time::Duration,
};

use tinydtls_sys::*;

use crate::psk_key::PSK_KEY;
const PSK_DEFAULT_IDENTITY: &str = "default";

const PREFIX: &'static str = "[LWPROXY]";
const MAX_SESSIONS: u64 = 16;

const DELAY: u64 = 16;

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

fn get_ipv6_string_from_bytes(addr: [u8; 16]) -> String {
    Ipv6Addr::new(
        addr[0] as u16 * 0x100 + addr[1] as u16,
        addr[2] as u16 * 0x100 + addr[3] as u16,
        addr[4] as u16 * 0x100 + addr[5] as u16,
        addr[6] as u16 * 0x100 + addr[7] as u16,
        addr[8] as u16 * 0x100 + addr[9] as u16,
        addr[10] as u16 * 0x100 + addr[11] as u16,
        addr[12] as u16 * 0x100 + addr[13] as u16,
        addr[14] as u16 * 0x100 + addr[15] as u16,
    )
    .to_string()
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
    debug_println!("WRITE CALLBACK");

    let socket = (*ctx).app as *mut UdpSocket;
    let addr = session.as_ref().unwrap().addr.sin6.as_ref();

    assert!(addr.sin6_family == AF_INET6 as u16);

    let res = (*socket).send_to(
        std::slice::from_raw_parts(buf, len as usize),
        SocketAddrV6::new(
            Ipv6Addr::from(addr.sin6_addr.s6_addr),
            u16::from_be(addr.sin6_port),
            addr.sin6_flowinfo,
            addr.sin6_scope_id,
        ),
    );

    match res {
        Ok(_) => len as i32,
        Err(_) => {
            debug_println!("Failed to send message");

            -1
        }
    }
}

unsafe extern "C" fn server_read_callback(
    _ctx: *mut dtls_context_t,
    session: *mut session_t,
    buf: *mut u8,
    len: usize,
) -> i32 {
    debug_println!("READ CALLBACK");

    // TODO: Try to make this variable persistent.
    let backend_socket: UdpSocket =
        UdpSocket::bind(":::5686").expect(debug_fmt!("Could not bind socket"));

    backend_socket
        .connect("::1:5683")
        .expect(debug_fmt!("Could not connect socket"));

    let addr = (*session).addr.sin6.as_ref().sin6_addr.s6_addr;
    debug_println!(format!("Message from {}", get_ipv6_string_from_bytes(addr)).as_str());

    let slice = std::slice::from_raw_parts(buf, len);
    let coap_err = Packet::from_bytes(slice);
    match coap_err {
        Ok(mut pkt) => {
            // Append sender IP for frontend
            let mut ser = Serializer::new_vec();
            ser.write_raw_bytes(pkt.payload.as_ref()).unwrap(); // Should never fail
            for octet in addr {
                ser.write_unsigned_integer(octet as u64).unwrap(); // Should never fail
            }
            pkt.payload = ser.finalize();

            backend_socket
                .send(pkt.to_bytes().unwrap().as_ref())
                .expect(debug_fmt!("Could not send data to backend"));
            debug_println!("Forwarded message to backend");
        }
        Err(_) => {
            debug_println!("Malformed CoAP package");
        }
    }

    0 // Ignored
}

unsafe extern "C" fn server_event_callback(
    _ctx: *mut dtls_context_t,
    _session: *mut session_t,
    level: dtls_alert_level_t,
    code: u16,
) -> i32 {
    debug_println!(format!(
        "EVENT CALLBACK - LEVEL: {} - CODE: {}",
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

    0 // Ignored
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
            assert!(PSK_KEY.len() <= result_length);
            let slice = std::slice::from_raw_parts_mut(result, result_length);
            slice.copy_from_slice(PSK_KEY.as_ref());
            assert!(slice == PSK_KEY);
            PSK_KEY.len() as i32
        }
        _ => {
            panic!()
        }
    }
}

fn main() {
    let mut dtls_socket = UdpSocket::bind(":::5684").expect(debug_fmt!("Could not bind socket"));
    let backend_socket = UdpSocket::bind(":::5685").expect(debug_fmt!("Could not bind socket"));
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

    let mut buf: [u8; 1024];
    let mut sessions: Vec<*mut session_t> = Vec::new();
    loop {
        // TODO: Make this async for more clarity.
        buf = [0; 1024]; // Clear buffer
        std::thread::sleep(Duration::from_millis(DELAY));
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
                    // Remove IP and send to appropriate client
                    // These branches are horrible
                    let mut des = Deserializer::from(Cursor::new(pkt.payload));
                    let mut ip: [u8; 16] = [0; 16];
                    for i in 0..16 {
                        ip[i] = match des.unsigned_integer() {
                            Ok(octet) => {
                                if u8::try_from(octet).is_ok() {
                                    octet as u8
                                } else {
                                    debug_println!("Malformed CoAP packet");
                                    continue;
                                }
                            }
                            Err(_) => {
                                debug_println!("Malformed CoAP packet");
                                continue;
                            }
                        }
                    }
                    let mut ser = Serializer::new_vec();

                    // Try to probe for a `/calibrate_sensor` packet
                    match des.negative_integer() {
                        Ok(dry_value) => match des.negative_integer() {
                            Ok(wet_value) => {
                                if i32::try_from(dry_value).is_ok()
                                    && i32::try_from(wet_value).is_ok()
                                {
                                    ser.write_negative_integer(dry_value).unwrap();
                                    ser.write_negative_integer(wet_value).unwrap();
                                } else {
                                    debug_println!("Malformed CoAP packet");
                                    continue;
                                }
                            }
                            Err(_) => {}
                        },
                        Err(_) => {}
                    }

                    // Check if for the IP an appropriate session exists
                    let mut session_index = usize::MAX;
                    unsafe {
                        for i in 0..sessions.len() {
                            if ip == (*sessions[i]).addr.sin6.as_ref().sin6_addr.s6_addr {
                                session_index = i;
                            }
                        }
                    }
                    if session_index != usize::MAX {
                        // Send
                        let mut new_pkt = ser.finalize();
                        unsafe {
                            dtls_write(
                                context,
                                sessions[session_index],
                                new_pkt.as_mut_ptr(),
                                new_pkt.len(),
                            );
                        }
                    } else {
                        debug_println!("No such session available");
                    }
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
