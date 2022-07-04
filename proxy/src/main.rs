/*
    TinyDTLS Proxy Server
    Note that this proxy is single threaded since tinydtls allows only one thread.

   References

   - http://tinydtls.sourceforge.net/group__dtls__usage.html
   - https://github.com/namib-project/tinydtls-rs/blob/main/tinydtls-sys/src/lib.rs
*/

#![feature(core_ffi_c, c_size_t)]
#![allow(improper_ctypes_definitions)]

pub mod cred;

use core::ffi::{c_int, c_size_t, c_uchar, c_ushort};
use libc::{in6_addr, sockaddr, sockaddr_in6, socklen_t, AF_INET6};
use std::{
    char::MAX,
    ffi::c_void,
    net::{Ipv6Addr, SocketAddr, SocketAddrV6, UdpSocket},
};

use tinydtls_sys::*;

const PREFIX: &'static str = "[LWPROXY]";
const DTLS_ECDSA_KEY: dtls_ecdsa_key_t = dtls_ecdsa_key_t {
    curve: dtls_ecdh_curve::DTLS_ECDH_CURVE_SECP256R1,
    priv_key: &cred::PRIVATE_DER[8], // According to `$ openssl ec -in private.pem -text -noout`
    pub_key_x: &cred::PUBLIC_DER[1],
    pub_key_y: &cred::PUBLIC_DER[33],
};
const MAX_SESSIONS: u64 = 16;

struct proxy_session {
    session: session_t,
}

impl Default for proxy_session {
    fn default() -> proxy_session {
        proxy_session {
            session: session_t {
                size: std::mem::sizeof(sockaddr_in6),
                addr: session_t__bindgen_ty_1 {
                    bindgen_union_field:
                } (sockaddr_in6 {
                    sin6_addr: in6_addr { s6_addr: [0; 16] },
                    sin6_family: 0,
                    sin6_flowinfo: 0,
                    sin6_port: 0,
                    sin6_scope_id: 0,
                }),
                ifindex: 0,
            },
        }
    }
}

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

unsafe extern "C" fn server_write_callback(
    ctx: *mut dtls_context_t,
    session: *mut session_t,
    buf: *mut u8,
    len: c_size_t,
) -> c_int {
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
    len: c_size_t,
) -> c_int {
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
    _level: dtls_alert_level_t,
    _code: c_ushort,
) -> c_int {
    debug_println!("EVENT");

    0
}

unsafe extern "C" fn server_get_ecdsa_key(
    _ctx: *mut dtls_context_t,
    _session: *const session_t,
    result: *mut *const dtls_ecdsa_key_t,
) -> c_int {
    debug_println!("GET_ECDSA_KEY");
    *result = &DTLS_ECDSA_KEY;

    0
}

unsafe extern "C" fn server_verify_ecdsa_key(
    _ctx: *mut dtls_context_t,
    _session: *const session_t,
    _other_pub_x: *const c_uchar,
    _other_pub_y: *const c_uchar,
    _key_size: c_size_t,
) -> c_int {
    // No verification needed for our usecase. Anyone can connect tot his address.
    debug_println!("VERIFICATION");

    0
}

fn main() {
    let mut socket = UdpSocket::bind(":::5684").expect(debug_fmt!("Could not bind socket"));

    let mut handlers = dtls_handler_t {
        event: Some(server_event_callback),
        write: Some(server_write_callback),
        read: Some(server_read_callback),
        get_psk_info: None,
        get_ecdsa_key: Some(server_get_ecdsa_key),
        verify_ecdsa_key: Some(server_verify_ecdsa_key),
    };
    let context: *mut dtls_context_t =
        unsafe { dtls_new_context(&mut socket as *mut UdpSocket as *mut c_void) };
    assert!(!context.is_null());
    unsafe { dtls_set_handler(context, &mut handlers) };

    let mut buf: [u8; 1024] = [0; 1024];
    let mut proxy_sessions: [proxy_session; MAX_SESSIONS as usize];
    let mut active_sessions = 0;
    loop {
        let (size, peer) = socket.recv_from(&mut buf).expect("Failed to receive data");

        let addr: sockaddr_in6 = match peer {
            SocketAddr::V4(_) => {
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
        };

        unsafe {
            let mut session_index = 0;
            for i in 0..active_sessions {
                if addr.sin6_addr.s6_addr
                    == proxy_sessions[i]
                        .session
                        .addr
                        .sin6
                        .as_ref()
                        .sin6_addr
                        .s6_addr
                {
                    session_index = i;
                }
            }
        }

        if active_sessions > MAX_SESSIONS as usize {
            debug_println!("maximum number of sessions reached");
            continue;
        }

        buf = [0; 1024];
    }
    /*     debug_println!("Received message.");
    let session: *mut session_t = match peer {
        SocketAddr::V4(_) => {
            debug_println!("Non-IPv6 peer.");
            panic!();
        }
        SocketAddr::V6(addr) => {
            let mut raw_addr = sockaddr_in6 {
                sin6_family: AF_INET6 as u16,
                sin6_port: addr.port().to_be(), // Standard network byte order
                sin6_flowinfo: addr.flowinfo(),
                sin6_addr: in6_addr {
                    s6_addr: addr.ip().octets(),
                },
                sin6_scope_id: addr.scope_id(),
            };

            unsafe {
                dtls_new_session(
                    &mut raw_addr as *mut sockaddr_in6 as *mut sockaddr,
                    std::mem::size_of::<sockaddr_in6>() as socklen_t,
                )
            }
        }
    };
    assert!(!session.is_null());
    debug_println!("Created session.");
    unsafe {
        dtls_handle_message(context, session, buf.as_mut_ptr(), size as c_int);
    }
    loop {
        let (size, peer) = socket.recv_from(&mut buf).expect("Failed to receive data");
        unsafe {
            dtls_handle_message(context, session, buf.as_mut_ptr(), size as c_int);
        }
    } */
}
