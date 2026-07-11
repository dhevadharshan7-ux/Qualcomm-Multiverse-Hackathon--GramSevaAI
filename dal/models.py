"""DAL wire types (CONTRACT.md §3)."""
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from shared.enums import DeviceReadingSource


class DeviceReading(BaseModel):
    device: str
    resource: str
    value: dict[str, Any]
    read_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: DeviceReadingSource


class DALResourceNotFound(Exception):
    """Raised when (device, resource) has no registered backend/resource."""

    def __init__(self, device: str, resource: str):
        self.device = device
        self.resource = resource
        super().__init__(f"No such resource: device={device!r} resource={resource!r}")
