"""Structured (JSON-lines) logging so routing decisions are grep-able, not buried.

This is the log stream judges will be pointed at for the Multi-Device
Orchestration prize criterion: every request logs intent, confidence, and
whether it stayed local or was cloud-escalated.
"""
import json
import logging
import sys


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        extra = getattr(record, "extra_fields", None)
        if extra:
            payload.update(extra)
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger("gram_seva")
    root.setLevel(logging.INFO)
    root.handlers = [handler]
    root.propagate = False


def log_routing_decision(logger: logging.Logger, **fields) -> None:
    logger.info("routing_decision", extra={"extra_fields": fields})
