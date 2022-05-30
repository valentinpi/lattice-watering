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

### Design Decisions

- nanocbor for commands as it has very low footprint and is non-proprietary
- WolfSSL for DTLS since it is non-proprietary
- Use of `pktbuf`s since we want to specify network interfaces manually
