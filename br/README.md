# br - The Border Router Firmware

## Starting

Inspect the `Makefile` and make necessary changes to the macros and commands according to your system. On a relatively standard system, it should work out of the box. For macros like `BOARD`, `SERIAL` and `PORT`, consult `$ make list-ttys`;

Start the `ethos` server:
```
$ sudo make ethos
```
And build and flash the border router firmware:
```
$ sudo make clean all flash
```
Of course, you may use `doas` instead of `sudo`.

## About Connectivity

One thing to note is that the subnet induced by the border router and its nodes configures itself by combining a fixed suffix with its link local addresses, which are obtained from SLAAC. For instance, if a device has a l2 address of `fe80::7b67:1860:420c:f43e` and we have a prefix `2001:db8::/64`, then the new address will be `2001:db8::7b67:1860:420c:f43e`. We do not use DHCPv6 or any other protocols for this task. Only the host has the unique address `2001:db8::`.
