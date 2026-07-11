"""Offline unit tests for the DAL + simulated Arduino backend.

device_state persistence is best-effort (dal/state_repo.py swallows DB
errors), so these pass even with no Postgres running.
"""
import pytest

from dal.interface import DAL
from dal.models import DALResourceNotFound
from dal.simulated_backend import DEVICE_NAME, SimulatedArduinoBackend


@pytest.fixture
def dal() -> DAL:
    return DAL({DEVICE_NAME: SimulatedArduinoBackend()})


def test_read_seeded_streetlight_status(dal):
    reading = dal.read(DEVICE_NAME, "streetlight_status")
    assert reading.value == {"on": True}
    assert reading.source.value == "simulated"


def test_write_then_read_water_pump_status(dal):
    dal.write(DEVICE_NAME, "water_pump_status", {"on": False, "flow_lpm": 0})
    reading = dal.read(DEVICE_NAME, "water_pump_status")
    assert reading.value == {"on": False, "flow_lpm": 0}


def test_unknown_device_raises():
    empty_dal = DAL({})
    with pytest.raises(DALResourceNotFound):
        empty_dal.read("nonexistent_device", "some_resource")


def test_unknown_resource_raises(dal):
    with pytest.raises(DALResourceNotFound):
        dal.read(DEVICE_NAME, "nonexistent_resource")
