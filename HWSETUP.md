# Setting up the Hardware

## Requirements

To build one border router and one of the node we used, you require:

1. One personal computer with the software set up.
2. Two SAMR21-XPRO boards, one border router and one node.
3. Two micro USB cables, optionally a battery connector or powerbank.
4. One DRV8833 motor driver board.
5. One electronic pump, see e.g. [1]. It should come with a long tube.
6. One capacitive moisture sensor, see e.g. [2].
7. Nine female jumper cables.
8. Five male jumper cables.

## Setup

The PC and the border router should be ready. The following describes how to setup a node.

Connect the female jumpers the following way:

|   Device 1 | Connection 1 | Connection 2 |   Device 2 |
|------------|--------------|--------------|------------|
| SAMR21XPRO |          5V0 |          VCC |     DRV883 |
| SAMR21XPRO |          GND |          GND |     DRV883 |
| SAMR21XPRO |         PA13 |          IN1 |     DRV883 |
| SAMR21XPRO |         PA13 |          EEP |     DRV883 |

Connect two female jumpers with two male jumpers and solder the two male jumpers on the two connectors of the pump. Connect three male jumpers with three female jumpers. Then connect the following way:

|   Device 1 | Connection 1 | Connection 2 |   Device 2 |
|------------|--------------|--------------|------------|
|    DRV8833 |         OUT1 |          RED |       PUMP |
| SAMR21XPRO |          GND |        GREEN |       PUMP |
| SAMR21XPRO |          GND |          GND | CAPACITIVE |
| SAMR21XPRO |           ID |          VCC | CAPACITIVE |
| SAMR21XPRO |         PA07 |         AUOT | CAPACITIVE |

Now you can connect the two boards and flash the border router and node firmwares. After that, you can disconnect the node from the PC and connect it to an external power supply, e.g. the battery or the powerbank. Finally, connect the tube to the pump by sticking onto the bit that is on the outside of the motor. The other end should obviously point towards a plant. Ours was about three meters long, so we cut off parts of it. The pump shall be submerged in water during operation.

## References

[1] https://www.amazon.de/RUNCCI-YUN-Wasserpumpe-Motorpumpe-Bew%C3%A4sserung-Blumen%EF%BC%88schwarz/dp/B08BZBN29C/ref=sr_1_5?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1QFI5ERCK8SWM&keywords=wasserpumpe+5v&qid=1652257784&sprefix=wasserpumpe+5v%2Caps%2C76&sr=8-5 (last access on 05.06.2022 21:53)

[2] https://www.amazon.com/dp/B07SYBSHGX/ref=sr_1_1_sspa?keywords=capacitive+moisture+sensor&qid=1654457857&sr=8-1-spons&psc=1&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUEyM1kwSzVKWFU3N0szJmVuY3J5cHRlZElkPUEwMDkwNDkyMUtMSU1WVktSU1dXNSZlbmNyeXB0ZWRBZElkPUEwNjczOTczMkdCUVRQTkk3SDJVOSZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU= (last access on 05.06.2022 21:54)
