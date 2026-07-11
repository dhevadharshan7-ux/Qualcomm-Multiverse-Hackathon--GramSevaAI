"""Grievance Platform API shapes (CONTRACT.md §4)."""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel

from shared.enums import Channel, GrievanceCategory, GrievanceStatus, Priority


class SensorCheck(BaseModel):
    device: str
    resource: str
    value: dict[str, Any]
    verdict: Literal["verified", "disputed"]


class GrievanceOut(BaseModel):
    id: str
    citizen_id: Optional[str]
    category: GrievanceCategory
    description: str
    location: Optional[str]
    priority: Priority
    source_channel: Channel
    status: GrievanceStatus
    department: str
    sensor_check: Optional[SensorCheck]
    created_at: datetime
    updated_at: datetime
