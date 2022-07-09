# Methods

These are the methods for communication between the frontend and the nodes. The frontend uses UDP, the backend DTLS.

### Frontend Methods

Accessible via IPv6 address `fc00::` and port 5683 (`CONFIG_GCOAP_PORT`).

| Route   | Method | Description |
|---------|--------|-------------|
| `/data` | POST   | Data Route  |

Every 5 seconds, depending on the configuration, the DTLS proxy receives a non-confirmable POST CBOR packet from the nodes and manipulates it into the form:
```
--------------------------------------------------------
| humidity (uint8, in percent) | pump_activated (bool) |
--------------------------------------------------------
---------------------------------------------
| dry_value (int32_t) | wet_value (int32_t) |
---------------------------------------------
-----------------------------------------
| rx_bytes (uint32) | rx_count (uint32) |
-----------------------------------------
-----------------------------------------------------------------------------------------------------------------------
| tx_bytes (uint32) | tx_unicast_count (uint32) | tx_mcast_count (uint32) | tx_success (uint32) |  tx_failed (uint32) |
-----------------------------------------------------------------------------------------------------------------------
-----------------------------------
| ip_addr (uint8[16], CBOR array) |
-----------------------------------
```
So the packet contains humidity information, the humdity sensor calibration, as well as info on the node itself: Whether its pump is activated and its current IPv6 statistics. Note that these statistics do not need to be saved. `count` refers to the number of packets. The data is aligned from left to right, top to bottom. We also post the IP address, as the packet will go through a tunnel, and our frontend uses some unique IPs for board identification.

### Node Methods

Accessible via port 5684 (`CONFIG_GCOAPS_PORT`).

| Route               | Method | Description                                 |
|---------------------|--------|---------------------------------------------|
| `/pump_toggle`      | POST   | Toggle the pump of the node board.          |
| `/calibrate_sensor` | POST   | Calibrate the humidity sensor on the board. |

It suffices to POST a single non-confirmable `COAP_CODE_EMPTY` package (a ping) to this endpoint.

The `/pump_toggle` method expects the following non-confirmable CBOR packet form:
```
-----------------------
| ip_addr (uint8[16]) |
-----------------------
```

The `/calibrate_sensor` method expects a non-nonfirmable CBOR packet of form:
```
-----------------------
| ip_addr (uint8[16]) |
-----------------------
---------------------------------------------
| dry_value (int32_t) | wet_value (int32_t) |
---------------------------------------------
```

Note that the DTLS proxy will remove both IP addresses before the packets reach the SixLoWPAN network.
