# lattice-watering

## Essentally Automation for Watering Your Plants

### Folder Hierarchy

- `br`: Border router firmware.
- `doc`: Documents we created during the software project.
- `front`: The frontend is a website from which one can see statistics on each plant and control the pumps.
- `fw`: Firmware for the clients that utilize sensory to water the plants.
- `man`: Manuals for the devices we use.
- `misc`: Mischief.

### General Conventions

- IPv6 only.
- UDP/CoAP for the communication with the IoT devices.
- The CoAP communication is stateless only.

### C Coding Conventions

- Use the included `clang-format` file. For VS Code see `xaver.clang-format`.
- Use `cppcheck` for static code checking. For VS Code see `QiuMingGe.cpp-check-lint`.
- Use the integer types `inttypes.h` provides.
- Buffers are to be zeroed out asap.
- Use `#pragma once`.

### JS Coding Conventions

- Use `use strict` in all scripts.

### Design Decisions

- `nanocbor` for commands as it has very low footprint and is non-proprietary
- We wanted to use `wolfssl` since it uses a GNU license, but it is not supported by `gnrc_dtls`
- No HW RNG, so we use a PRNG. `prng_tinymt32` looks promising, as it is standardized in RFC8682, but we could not choose it, so we went with `prng_sha256prng`, since it might provide better security than SHA-1.
- There is WDT integration in the `fw` code, but not in the `br`, as its code is much less complex.
- We do not use the LED nor an additional HDC1000 sensor due to energy usage.
- We use SQLite as it suffices for our use case. We do not need a multi-user highly concurrent database, only if we were to attach several thousand sensors, and even then: Every five seconds the packets are sent, and the host is more than strong enough to handle such a load, not even speaking of the possible package loss in the meantime.
- Every board has its own ECC key, which is generated by the `gen_keys` command in the `justfile`. So if one of the boards' secret is compromised, the whole network is still relatively safe. This is also possible because the SixLoWPAN features are stacked on top of the DTLS layer.
- For reducing computational cost, we wanted to use `brainpoolP160r1` as our elliptic curve, standardized in RFC 5639. However, `tinydtls` does not support it, so we use `secp256r1` instead..
- Due to very poor support of DTLS in node.js at the time, we implemented our own DTLS proxy in RIOT native. This was needed as the implementations and proxies we found were not working, as well as OpenSSL, and writing an OpenSSL proxy would have taken too much time.

### Starting the System

To start the system, the `proxy` software and its ethos interface has to be started, and the `br` and `fw` firmwares have to be flashed onto the boards.

### Possible Future Enhancements

- Use TypeScript instead of JavaScript in teh frontend.
- The TinyDTLS library comes with a weak PRNG, replace it with a tough one.
- Improve the Rust proxy server. A possible larger project could be to build a very good and easy to use DTLS library with support for multiple platforms such as Node JS, since no library currently really accomplishes that.
- The `proxy` does not verify ECDSA keys, handle `tinydtls` events and does not discard connected devices, meaning that the `sessions` vector will have run out of space at some point. This was made so due to time constraints. Regular restarts could fix this issue.
