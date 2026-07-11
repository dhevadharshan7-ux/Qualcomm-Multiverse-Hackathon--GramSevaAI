"""Grievance business logic: department routing, sensor cross-check, persistence.

Sensor cross-check heuristic (streetlight/water only, CONTRACT.md §4): a
citizen complaint implies the device is *not* working. If the DAL reading
says the device is on/flowing, that contradicts the complaint -> `disputed`.
If the reading confirms it's off/not flowing -> `verified`. This is a
deliberately simple heuristic for the hackathon demo, not NLP-grade — swap
in something smarter post-hackathon if the complaint text itself needs
parsing (e.g. "water overflowing" vs "no water").
"""
import functools
import pathlib

import yaml

from dal.interface import DAL
from dal.models import DeviceReading
from grievance.models import GrievanceORM
from grievance.schemas import GrievanceOut, SensorCheck
from shared.enums import GrievanceCategory, GrievanceStatus

_ROUTING_CONFIG_PATH = pathlib.Path(__file__).parent / "config" / "routing.yaml"

_SENSOR_RESOURCE_BY_CATEGORY = {
    GrievanceCategory.STREETLIGHT: "streetlight_status",
    GrievanceCategory.WATER: "water_pump_status",
}
_SENSOR_DEVICE = "arduino_uno_q"


@functools.lru_cache(maxsize=1)
def _routing_config() -> dict[str, str]:
    with open(_ROUTING_CONFIG_PATH) as f:
        return yaml.safe_load(f)


def department_for(category: GrievanceCategory) -> str:
    config = _routing_config()
    return config.get(category.value, config["other"])


def _is_device_active(reading: DeviceReading) -> bool:
    """True if the sensor says the device is functioning (on / flowing)."""
    value = reading.value
    if not value.get("on", False):
        return False
    if "flow_lpm" in value:
        return value["flow_lpm"] > 0
    return True


def sensor_cross_check(dal: DAL, category: GrievanceCategory) -> tuple[SensorCheck, DeviceReading] | None:
    resource = _SENSOR_RESOURCE_BY_CATEGORY.get(category)
    if resource is None:
        return None
    reading = dal.read(_SENSOR_DEVICE, resource)
    verdict = "disputed" if _is_device_active(reading) else "verified"
    check = SensorCheck(device=reading.device, resource=reading.resource, value=reading.value, verdict=verdict)
    return check, reading


def create_grievance(db, dal: DAL, fields) -> GrievanceORM:
    department = department_for(fields.category)
    cross_check = sensor_cross_check(dal, fields.category)

    status = GrievanceStatus.SUBMITTED
    sensor_device = sensor_resource = sensor_verdict = None
    sensor_value = None
    if cross_check is not None:
        check, reading = cross_check
        status = GrievanceStatus.VERIFIED if check.verdict == "verified" else GrievanceStatus.DISPUTED
        sensor_device, sensor_resource = check.device, check.resource
        sensor_value, sensor_verdict = check.value, check.verdict

    row = GrievanceORM(
        citizen_id=fields.citizen_id,
        category=fields.category.value,
        description=fields.description,
        location=fields.location,
        priority=fields.priority.value,
        source_channel=fields.source_channel.value,
        status=status.value,
        department=department,
        sensor_device=sensor_device,
        sensor_resource=sensor_resource,
        sensor_value=sensor_value,
        sensor_verdict=sensor_verdict,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_grievance(db, grievance_id: str) -> GrievanceORM | None:
    return db.get(GrievanceORM, grievance_id)


def to_out(row: GrievanceORM) -> GrievanceOut:
    sensor_check = None
    if row.sensor_device:
        sensor_check = SensorCheck(
            device=row.sensor_device,
            resource=row.sensor_resource,
            value=row.sensor_value or {},
            verdict=row.sensor_verdict,
        )
    return GrievanceOut(
        id=str(row.id),
        citizen_id=row.citizen_id,
        category=GrievanceCategory(row.category),
        description=row.description,
        location=row.location,
        priority=row.priority,
        source_channel=row.source_channel,
        status=row.status,
        department=row.department,
        sensor_check=sensor_check,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
