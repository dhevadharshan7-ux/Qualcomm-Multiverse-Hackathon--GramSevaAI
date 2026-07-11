"""ID update-request API. Mounted into the orchestrator app at /id-requests."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from id_services import service
from id_services.schemas import DocumentAttachResult, IDUpdateRequestOut
from orchestrator.vision import DocumentVisionClient, get_vision_client
from shared.db import get_db
from shared.schemas import IDUpdateRequestFields

router = APIRouter()

_MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB


@router.post("", response_model=IDUpdateRequestOut, status_code=201)
def create_request(payload: IDUpdateRequestFields, db=Depends(get_db)):
    row = service.create_request(db, payload)
    return service.to_out(row)


@router.get("/{request_id}", response_model=IDUpdateRequestOut)
def get_request(request_id: str, db=Depends(get_db)):
    row = service.get_request(db, request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="id update request not found")
    return service.to_out(row)


@router.post("/{request_id}/document", response_model=DocumentAttachResult)
async def attach_document(
    request_id: str,
    file: UploadFile = File(...),
    db=Depends(get_db),
    vision_client: DocumentVisionClient = Depends(get_vision_client),
):
    row = service.get_request(db, request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="id update request not found")

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="file too large (max 8MB)")

    warnings = service.attach_document(db, row, vision_client, image_bytes, file.filename or "upload")
    return DocumentAttachResult(request=service.to_out(row), warnings=warnings)
