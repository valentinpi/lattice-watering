# lattice-watering

## Essentally Automation for Watering Your Plants

### Folder Hierarchy

- `br`: Border router firmware.
- `doc`: Documents we created during the software project.
- `front`: The frontend is a website from which one can see statistics on each plant and control the pumps.
- `fw`: Firmware for the clients that utilize sensory to water the plants.
- `man`: Manuals for the devices we use.
- `misc`: Mischief.

### C Coding Conventions

- Use the included `clang-format` file. For VS Code see `xaver.clang-format`.
- Use `cppcheck` for static code checking. For VS Code see `QiuMingGe.cpp-check-lint`.
- Use the integer types `inttypes.h` provides.
- Buffers are to be zeroed out asap.

### JS Coding Conventions

- Use `use strict` in all scripts.

### Design Decisions

- `nanocbor` for commands as it has very low footprint and is non-proprietary
- We wanted to use `wolfssl` since it uses a GNU license, but it is not supported by `gnrc_dtls`
- No HW RNG, so we use a PRNG. `prng_tinymt32` looks promising, as it is standardized in RFC8682, but we could not choose it, so we went with `prng_sha256prng`, since it might provide better security than SHA-1.
- There is WDT integration in the `fw` code, but not in the `br`, as its code is much less complex.
