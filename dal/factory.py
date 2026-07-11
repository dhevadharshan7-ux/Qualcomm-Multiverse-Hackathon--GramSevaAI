"""Dependency-injection point for the DAL.

To wire in a real Arduino UNO Q backend later: implement `DeviceBackend`
(e.g. `dal/serial_backend.py`) and swap it in here. Nothing in orchestrator
or grievance changes.
"""
from dal.interface import DAL
from dal.simulated_backend import DEVICE_NAME, SimulatedArduinoBackend

_dal_instance: DAL | None = None


def get_dal() -> DAL:
    global _dal_instance
    if _dal_instance is None:
        _dal_instance = DAL({DEVICE_NAME: SimulatedArduinoBackend()})
    return _dal_instance
