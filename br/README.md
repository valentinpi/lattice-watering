# br - The Border Router Firmware

## Starting

Inspect the `Makefile` and make necessary changes to the macros and commands according to your system. On a relatively standard system, it should work out of the box.

Start the `ethos` server (using `sudo` or `doas` e.g.):
```
# make ethos
```
Notice that for this to succeed, you may need to manually build the `ethos` program by RIOT. It can be found in `RIOT/dist/tools/ethos`. Just execute `make` there and you are set. Also, the `Makefile` assumes that the RIOT base directory is in `lattice-watering/../`. You may need to adjust this, or, if you have enough space, you can just clone the repository twice. This should not be an issue. Installing the necessary dependencies is also your task, executing `make print-versions` in the base directory of RIOT can help quite tremendously.

And build and flash the border router firmware (depending on your udev rules you may need to execute this as root), you first figure out your board using the `board` directory and RIOT documentation and then your board serial number using:
```
$ BOARD=samr21-xpro make list-ttys
```
In our case, we use the `samr21-xpro` board for the border router and the nodes as well. To flash, one can, for instance, execute:
```
$ BOARD=samr21-xpro SERIAL=ATML2127031800004672 make clean all flash
```

## About Connectivity

One thing to note is that the subnet induced by the border router and its nodes configures itself by combining a fixed suffix with its link local addresses, which are obtained from SLAAC. For instance, if a device has a l2 address of `fe80::7b67:1860:420c:f43e` and we have a prefix `fc00::/64`, then the new address will be `fc00::7b67:1860:420c:f43e`. We do not use DHCPv6 or any other protocols for this task. Only the host has the unique address `fc00::`.
