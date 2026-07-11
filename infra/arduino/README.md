# Arduino UNO Q — sensing layer

For this hackathon pass, `streetlight_status` and `water_pump_status` are
served by [`dal/simulated_backend.py`](../../dal/simulated_backend.py), an
in-memory backend behind the same `DeviceBackend` interface a real board
will use.

## Simulated state (current)

| Resource | Shape | Seed value |
|---|---|---|
| `streetlight_status` | `{"on": bool}` | `{"on": true}` |
| `water_pump_status` | `{"on": bool, "flow_lpm": float}` | `{"on": true, "flow_lpm": 12.5}` |

Toggle state during a demo via the DAL's `write()` — e.g. from a Python
shell or a small script that calls `dal.factory.get_dal().write("arduino_uno_q",
"water_pump_status", {"on": False, "flow_lpm": 0})` — to show a grievance
flip from `disputed` to `verified` live.

## Wiring in the real board later

1. Implement `DeviceBackend` (see `dal/interface.py`) in a new
   `dal/serial_backend.py` — same `read(resource)` / `write(resource, payload)`
   signatures, backed by pyserial/GPIO instead of an in-memory dict.
2. Register it in `dal/factory.py` in place of (or alongside)
   `SimulatedArduinoBackend`, keyed by the same device name (`arduino_uno_q`).
3. Nothing in `orchestrator/` or `grievance/` changes — they only ever call
   `dal.read(device, resource)` / `dal.write(...)`.
