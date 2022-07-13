# lattice-watering

## Essentally Automation for Watering Your Plants

### Folder Hierarchy

- `br`: Border router firmware.
- `doc`: Documents we created during the software project.
- `front`: The frontend is a website from which one can see statistics on each plant and control the pumps.
- `fw`: Firmware for the clients that utilize sensory to water the plants.
- `man`: Manuals for the devices we use.
- `misc`: Mischief that was created during development. You can look at it for the giggles.
- `proxy`: A DTLS proxy based on `tinydtls` written in Rust.
- `psk`: PSK key used, remember to regenerate this once in a while.

To replicate our project, you will need to follow the steps of the `HWSETUP.md` file to first create a border router and at least one node board. Then, you will want to flash both of these. Please look into flashing a border router, `br`, first, as the explanations there are very similar to `fw` (node firmware). Also, you will need to build the proxy that is used for translating DTLS traffic. You will also want to create new PSK keys, you can do that by running:
```
$ just gen_psk
```
`just` is a small program that is similar to `make`, but not a build tool, but a script runner. Look into the `justfile` for the commands we have written.

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
- Use `snake_case`.

### JS Coding Conventions

- Use `use strict` in all scripts.
- Use `snake_case`.
- Always use `let` instead of `var`.

### Design Decisions

- CoAP instead of MQTT-SN due to... TODO:
- `nanocbor` for commands as it has very low footprint and is non-proprietary.
- We wanted to use `wolfssl` since it uses a GNU license, but it is not supported by `gnrc_dtls`, so we use `tinydtls`
- The SAMR21-XPRO boards have no HW RNG, so we use a PRNG. We went with `prng_sha256prng`, since it might provide better security than `prng_sha1prng` at a possibly slightly higher computational cost. Security in IoT should not be overlooked.
- We do not use the LED nor an additional HDC1000 sensor due to energy usage.
- We use SQLite as it suffices for our use case. We do not need a multi-user highly concurrent database, only if we were to attach several thousand sensors, and even then: Every five seconds the packets are sent, and the host is more than strong enough to handle such a load, not even speaking of the possible package loss in the meantime.
- To make authentication easy, we use PSKs (Pre-Shared Secrets) to build DTLS connections, such that only peers who have the same secret can communicate with one another. In our threat model, we assume that no board will be compromised. Sadly, the `tinydtls` RIOT implementation apprently only supports 16 byte large keys.
- Due to very poor support of DTLS in node.js at the time, we implemented our own DTLS proxy in RIOT native. This was needed as the implementations and proxies we found were not working, as well as OpenSSL, and writing an OpenSSL proxy would have taken too much time.

### Starting the System

To start the system, the `proxy` software and the `ethos` interface have to be started, and the `br` and `fw` firmwares have to be flashed onto the boards.

### Possible Future Enhancements

- Use TypeScript instead of JavaScript in the frontend.
- The TinyDTLS library comes with a weak PRNG, replace it with a tough one.
- Improve the Rust proxy server. A possible larger project could be to build a very good and easy to use DTLS library with support for multiple platforms such as Node JS, since no library currently really accomplishes that. Handle `tinydtls` events. Currently, the proxy does not discard connected devices, meaning that the `sessions` vector will have run out of space at some point. This was made so due to time constraints. Regular restarts could fix this issue in practical. The proxy should be made asynchronous aswell.
