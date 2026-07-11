"""ID update-request API shapes.

This module facilitates a REQUEST to correct/update a government ID —
it never writes to UIDAI/NSDL/Parivahan. `status` tracks the request
through a human-reviewed workflow ending in a citizen being told where
and with what documents to go in person.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from shared.enums import Channel, IDDocumentType, IDRequestStatus


class IDUpdateRequestOut(BaseModel):
    id: str
    citizen_id: Optional[str]
    id_type: IDDocumentType
    update_type: str
    description: str
    source_channel: Channel
    status: IDRequestStatus
    authority_office: str
    extracted_fields: Optional[dict[str, str]]
    document_ref: Optional[str]
    created_at: datetime
    updated_at: datetime


class DocumentAttachResult(BaseModel):
    request: IDUpdateRequestOut
    warnings: list[str] = []
