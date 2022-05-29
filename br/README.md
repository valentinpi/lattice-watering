# br

The border router can be started by flashing the firmware and starting the ethos server:
```
$ sudo make setup_network
```
Notice that you may have to adjust the `BOARD` and `SERIAL` flags, the baudrate and the port in the Makefile. For the latter, consult `$ make list-ttys`.
