"""Device Abstraction Layer.

Orchestrator and Grievance Platform both depend only on `DAL.read`/`DAL.write`
(CONTRACT.md §3) — never on a concrete backend. Swapping the simulated Arduino
backend for a real serial/GPIO one means writing a new `DeviceBackend` and
registering it in dal/factory.py; nothing else changes.
"""
from abc import ABC, abstractmethod
from typing import Any

from dal.models import DALResourceNotFound, DeviceReading


class DeviceBackend(ABC):
    """One backend per physical device, keyed by device name in the DAL."""

    @abstractmethod
    def read(self, resource: str) -> DeviceReading: ...

    @abstractmethod
    def write(self, resource: str, payload: dict[str, Any]) -> DeviceReading: ...


class DAL:
    def __init__(self, backends: dict[str, DeviceBackend]):
        self._backends = backends

    def read(self, device: str, resource: str) -> DeviceReading:
        backend = self._backends.get(device)
        if backend is None:
            raise DALResourceNotFound(device, resource)
        return backend.read(resource)

    def write(self, device: str, resource: str, payload: dict[str, Any]) -> DeviceReading:
        backend = self._backends.get(device)
        if backend is None:
            raise DALResourceNotFound(device, resource)
        return backend.write(resource, payload)
