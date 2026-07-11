"""Simulated Arduino UNO Q backend.

Implements the same `DeviceBackend` interface a real serial/GPIO backend
will implement later — orchestrator and grievance code never know the
difference. In-memory state, seeded so the demo has something to read
on first boot.
"""
from datetime import datetime, timezone
from typing import Any

from dal import state_repo
from dal.interface import DeviceBackend
from dal.models import DALResourceNotFound, DeviceReading
from shared.enums import DeviceReadingSource

DEVICE_NAME = "arduino_uno_q"


class SimulatedArduinoBackend(DeviceBackend):
    def __init__(self):
        self._state: dict[str, dict[str, Any]] = {
            "streetlight_status": {"on": True},
            "water_pump_status": {"on": True, "flow_lpm": 12.5},
        }

    def read(self, resource: str) -> DeviceReading:
        if resource not in self._state:
            raise DALResourceNotFound(DEVICE_NAME, resource)
        reading = DeviceReading(
            device=DEVICE_NAME,
            resource=resource,
            value=dict(self._state[resource]),
            read_at=datetime.now(timezone.utc),
            source=DeviceReadingSource.SIMULATED,
        )
        state_repo.upsert(reading)
        return reading

    def write(self, resource: str, payload: dict[str, Any]) -> DeviceReading:
        if resource not in self._state:
            raise DALResourceNotFound(DEVICE_NAME, resource)
        self._state[resource].update(payload)
        return self.read(resource)
