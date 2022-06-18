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
```

### Node Routes

Accessible via port 5684 (`CONFIG_GCOAPS_PORT`).

| Route          | Method | Description                        |
|----------------|--------|------------------------------------|
| `/pump_toggle` | POST   | Toggle the pump of the node board. |

It suffices to POST a single non-confirmable `COAP_CODE_EMPTY` package (a ping) to this endpoint.
