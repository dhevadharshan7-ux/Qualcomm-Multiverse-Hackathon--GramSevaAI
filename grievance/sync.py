"""Stub for opportunistic sync to the government cloud DB.

CONTRACT.md §6: fire-and-forget, must never fail or block the local
Postgres write. Called via FastAPI BackgroundTasks after the response's
local write has already committed.
"""
import logging

logger = logging.getLogger("gram_seva.grievance")


def sync_to_gov_cloud(grievance_id: str) -> None:
    try:
        # Real implementation later: push to gov cloud DB when connectivity
        # is available. No network dependency for the hackathon demo.
        logger.info(
            "sync_to_gov_cloud stub invoked", extra={"extra_fields": {"grievance_id": grievance_id}}
        )
    except Exception:
        logger.warning("sync_to_gov_cloud failed (non-fatal)", exc_info=True)
