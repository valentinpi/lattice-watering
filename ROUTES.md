# Routes

These are the routes for communication between the frontend and the nodes.

### Frontend Routes

Accessible via ipv6 address 2001:db8:2:: and port 5684 (`CONFIG_GCOAPS_PORT`).

| Route   | Method | Description |
|---------|--------|-------------|
| `/data` | POST   | Data Route  |

Every 5 seconds, depending on the configuration, the nodes POST a non-confirmable CBOR packet of form:

```
--------------------------------------------------------
| humidity (uint8, in percent) | pump_activated (bool) |
--------------------------------------------------------
-----------------------------------------
| rx_bytes (uint32) | rx_count (uint32) |
-----------------------------------------
-----------------------------------------------------------------------------------------------------------------------
| tx_bytes (uint32) | tx_unicast_count (uint32) | tx_mcast_count (uint32) | tx_success (uint32) |  tx_failed (uint32) |
-----------------------------------------------------------------------------------------------------------------------
```
So the packet contains humidity information, as well as info on the node itself: Whether its pump is activated and its current IPv6 statistics. Note that these statistics do not need to be saved. `count` refers to the number of packets. The data is aligned from left to right, top to bottom.

### Node Routes

Accessible via port 5684 (`CONFIG_GCOAPS_PORT`).

| Route          | Method | Description                        |
|----------------|--------|------------------------------------|
| `/pump_toggle` | POST   | Toggle the pump of the node board. |

It suffices to POST a single non-confirmable `COAP_CODE_EMPTY` package (a ping) to this endpoint.
