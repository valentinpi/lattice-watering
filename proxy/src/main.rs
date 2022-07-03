#![feature(core_ffi_c, c_size_t)]
#![allow(improper_ctypes_definitions)]

pub mod cred;

/*
    TinyDTLS Proxy Server
    Note that this proxy is single threaded since tinydtls allows only one thread.

   References

   - http://tinydtls.sourceforge.net/group__dtls__usage.html
   - https://github.com/namib-project/tinydtls-rs/blob/main/tinydtls-sys/src/lib.rs
*/

use core::ffi::{c_int, c_size_t, c_uchar, c_ushort};
use libc::{in6_addr, sockaddr, sockaddr_in6, socklen_t, AF_INET6};
use std::{
    ffi::c_void,
    net::{SocketAddr, UdpSocket},
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

macro_rules! debug_fmt {
    ($s:literal) => {
        format!("{} {}", PREFIX, $s).as_str()
    };
}

macro_rules! debug_println {
    ($s:literal) => {
        println!("{}", debug_fmt!($s));
    };
}

unsafe extern "C" fn server_write_callback(
    _ctx: *mut dtls_context_t,
    _session: *mut session_t,
    _buf: *mut u8,
    _len: c_size_t,
) -> c_int {
    0
}

unsafe extern "C" fn server_read_callback(
    ctx: *mut dtls_context_t,
    session: *mut session_t,
    buf: *mut u8,
    len: c_size_t,
) -> c_int {
    let mut backend = UdpSocket::bind("::1:5685").expect(debug_fmt!("Could not bind socket."));
    backend
        .connect("::1:5683")
        .expect(debug_fmt!("Could not connect socket."));
    backend
        .send(&*buf)
        .expect(debug_fmt!("Could not send data to backend."));

    0
}

unsafe extern "C" fn server_event_callback(
    _ctx: *mut dtls_context_t,
    _session: *mut session_t,
    _level: dtls_alert_level_t,
    _code: c_ushort,
) -> c_int {
    0
}

unsafe extern "C" fn server_get_ecdsa_key(
    _ctx: *mut dtls_context_t,
    _session: *const session_t,
    result: *mut *const dtls_ecdsa_key_t,
) -> c_int {
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
    0
}

fn main() {
    let mut socket = UdpSocket::bind("::1:5684").expect(debug_fmt!("Could not bind socket."));

    let mut handlers = dtls_handler_t {
        write: Some(server_write_callback),
        read: Some(server_read_callback),
        event: Some(server_event_callback),
        get_psk_info: None,
        get_ecdsa_key: Some(server_get_ecdsa_key),
        verify_ecdsa_key: Some(server_verify_ecdsa_key),
    };
    let context: *mut dtls_context_t =
        unsafe { dtls_new_context(&mut socket as *mut UdpSocket as *mut c_void) };
    assert!(!context.is_null());
    unsafe { dtls_set_handler(context, &mut handlers) };

    let mut buf: [u8; 512] = [0; 512];
    loop {
        let (size, peer) = socket.recv_from(&mut buf).expect("Failed to receive data.");
        let session: *mut session_t = match peer {
            SocketAddr::V4(_) => {
                debug_println!("Non-IPv6 peer.");
                continue;
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
        unsafe {
            dtls_handle_message(context, session, buf, size);
            dtls_free_session(session);
        }
    }
}
