"""ID update-request business logic: office routing, document-photo intake, persistence."""
import functools
import pathlib

import yaml

from id_services.models import IDUpdateRequestORM
from id_services.schemas import IDUpdateRequestOut
from orchestrator.vision import DocumentVisionClient
from shared.enums import IDDocumentType, IDRequestStatus

_ROUTING_CONFIG_PATH = pathlib.Path(__file__).parent / "config" / "routing.yaml"


@functools.lru_cache(maxsize=1)
def _routing_config() -> dict[str, str]:
    with open(_ROUTING_CONFIG_PATH) as f:
        return yaml.safe_load(f)


def office_for(id_type: IDDocumentType) -> str:
    config = _routing_config()
    return config.get(id_type.value, config["other"])


def create_request(db, fields) -> IDUpdateRequestORM:
    row = IDUpdateRequestORM(
        citizen_id=fields.citizen_id,
        id_type=fields.id_type.value,
        update_type=fields.update_type,
        description=fields.description,
        source_channel=fields.source_channel.value,
        status=IDRequestStatus.SUBMITTED.value,
        authority_office=office_for(fields.id_type),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_request(db, request_id: str) -> IDUpdateRequestORM | None:
    return db.get(IDUpdateRequestORM, request_id)


def attach_document(
    db, row: IDUpdateRequestORM, vision_client: DocumentVisionClient, image_bytes: bytes, filename: str
) -> list[str]:
    """Runs OCR extraction on an uploaded ID photo, masks sensitive fields,
    and moves the request into document_review. Returns any warnings from
    the extraction (e.g. fields that were masked)."""
    result = vision_client.extract(image_bytes, filename)
    row.extracted_fields = result.fields
    row.document_ref = filename
    row.status = IDRequestStatus.DOCUMENT_REVIEW.value
    db.add(row)
    db.commit()
    db.refresh(row)
    return result.warnings


def to_out(row: IDUpdateRequestORM) -> IDUpdateRequestOut:
    return IDUpdateRequestOut(
        id=str(row.id),
        citizen_id=row.citizen_id,
        id_type=IDDocumentType(row.id_type),
        update_type=row.update_type,
        description=row.description,
        source_channel=row.source_channel,
        status=row.status,
        authority_office=row.authority_office,
        extracted_fields=row.extracted_fields,
        document_ref=row.document_ref,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
