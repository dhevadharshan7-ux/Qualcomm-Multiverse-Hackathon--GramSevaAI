"""Mirrors the latest DAL reading into Postgres `device_state` (CONTRACT.md §5).

Best-effort only: the DAL must keep working (simulated or real) even if
Postgres is unreachable, so failures here are logged and swallowed rather
than raised.
"""
import logging

from sqlalchemy import text

from dal.models import DeviceReading
from shared.db import engine

logger = logging.getLogger("gram_seva.dal")

_UPSERT = text(
    """
    INSERT INTO device_state (device, resource, value, source, read_at)
    VALUES (:device, :resource, CAST(:value AS JSONB), :source, :read_at)
    ON CONFLICT (device, resource)
    DO UPDATE SET value = EXCLUDED.value, source = EXCLUDED.source, read_at = EXCLUDED.read_at
    """
)


def upsert(reading: DeviceReading) -> None:
    import json

    try:
        with engine.begin() as conn:
            conn.execute(
                _UPSERT,
                {
                    "device": reading.device,
                    "resource": reading.resource,
                    "value": json.dumps(reading.value),
                    "source": reading.source.value,
                    "read_at": reading.read_at,
                },
            )
    except Exception:
        logger.warning("device_state upsert failed (non-fatal): %s", reading, exc_info=True)
