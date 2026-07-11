"""SQLAlchemy ORM model for `id_update_requests` (shared/schema.sql).

Deliberately has no field for a full ID number — only `extracted_fields`
(already masked by orchestrator/vision.py before it ever reaches here)
and `document_ref` (a pointer to the uploaded photo, not its contents).
"""
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from shared.db import Base


class IDUpdateRequestORM(Base):
    __tablename__ = "id_update_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id: Mapped[str | None] = mapped_column(String, nullable=True)
    id_type: Mapped[str] = mapped_column(String, nullable=False)
    update_type: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_channel: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    authority_office: Mapped[str] = mapped_column(String, nullable=False)
    extracted_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    document_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
