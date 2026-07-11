"""Document/ID vision-OCR client — the third local model.

Extracts fields from a photographed Aadhaar/PAN/Driving Licence so the
id_services module can pre-fill an update REQUEST. This never talks to
UIDAI/NSDL/Parivahan — it only reads a photo the citizen already has.

Data-minimization guardrail (non-negotiable, see DATA_GOVERNANCE.md):
any full-length government ID number found in the model's output is
masked down to its last 4 characters before this module returns it to
any caller. Nothing upstream of `mask_sensitive_fields` ever sees the
full number, and the full number is never persisted or logged.
"""
import base64
import logging
import os
import re
from abc import ABC, abstractmethod
from typing import Literal

import httpx
from pydantic import BaseModel

from shared.enums import IDDocumentType

logger = logging.getLogger("gram_seva.vision")

# 12-digit Aadhaar (optionally space-grouped 4-4-4), 10-char PAN, and a loose
# alphanumeric DL-number pattern. Deliberately broad — false positives just
# mean an extra field gets masked, which is the safe failure direction.
_AADHAAR_RE = re.compile(r"\b(\d{4}\s?\d{4}\s?\d{4})\b")
_PAN_RE = re.compile(r"\b([A-Z]{5}\d{4}[A-Z])\b")
_DL_RE = re.compile(r"\b([A-Z]{2}\d{2}\s?\d{4,11})\b")


def _mask_keep_last4(value: str) -> str:
    digits_only = re.sub(r"\s", "", value)
    if len(digits_only) <= 4:
        return "*" * len(digits_only)
    return "*" * (len(digits_only) - 4) + digits_only[-4:]


def mask_sensitive_fields(fields: dict[str, str]) -> dict[str, str]:
    """Masks any ID-number-shaped value to its last 4 characters."""
    masked = {}
    for key, value in fields.items():
        if not isinstance(value, str):
            masked[key] = value
            continue
        if _AADHAAR_RE.fullmatch(value.strip()) or _PAN_RE.fullmatch(value.strip()) or (
            "number" in key.lower() and re.search(r"\d{4,}", value)
        ):
            masked[key] = _mask_keep_last4(value)
        else:
            masked[key] = value
    return masked


class DocumentExtractionResult(BaseModel):
    document_type: IDDocumentType | Literal["unknown"]
    fields: dict[str, str]
    warnings: list[str] = []


class DocumentVisionClient(ABC):
    @abstractmethod
    def extract(self, image_bytes: bytes, filename: str) -> DocumentExtractionResult: ...


# ---------------------------------------------------------------------------
# Stub backend — offline, filename-based type guess only. Default so the
# document-upload path never hard-fails when no vision model is configured.
# ---------------------------------------------------------------------------

_FILENAME_TYPE_HINTS = {
    IDDocumentType.AADHAAR: ["aadhaar", "aadhar", "uid"],
    IDDocumentType.PAN: ["pan"],
    IDDocumentType.DRIVING_LICENSE: ["dl", "license", "licence"],
}


class StubDocumentVisionClient(DocumentVisionClient):
    def extract(self, image_bytes: bytes, filename: str) -> DocumentExtractionResult:
        name = filename.lower()
        doc_type: IDDocumentType | Literal["unknown"] = "unknown"
        for candidate, hints in _FILENAME_TYPE_HINTS.items():
            if any(h in name for h in hints):
                doc_type = candidate
                break
        return DocumentExtractionResult(
            document_type=doc_type,
            fields={},
            warnings=[
                "No vision model configured (VISION_BACKEND=stub) — document type guessed "
                "from filename only, no fields extracted. Set VISION_BACKEND to enable OCR."
            ],
        )


# ---------------------------------------------------------------------------
# Local vision-language model backend, served Ollama-style (e.g. a quantized
# Qwen2-VL pulled into the same Ollama instance serving Gemma4). Select with
# VISION_BACKEND=ollama-vlm.
# ---------------------------------------------------------------------------

_VISION_PROMPT = """Look at this photo of an Indian government ID document. Identify the \
document type and extract visible fields as a flat JSON object.

Respond with ONLY a JSON object matching this shape:
{"document_type": "aadhaar|pan|driving_license|other", "fields": {"name": "...", \
"date_of_birth": "...", "id_number": "...", "address": "..."}}

Only include fields you can actually read. If the image is unclear or not an ID document, \
set document_type to "other" and return an empty fields object."""


class OllamaVisionClient(DocumentVisionClient):
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = model or os.getenv("VISION_MODEL", "qwen2-vl:2b")

    def extract(self, image_bytes: bytes, filename: str) -> DocumentExtractionResult:
        import json

        b64_image = base64.b64encode(image_bytes).decode("ascii")
        resp = httpx.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": _VISION_PROMPT,
                "images": [b64_image],
                "stream": False,
                "format": "json",
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        parsed = json.loads(resp.json()["response"])

        raw_fields = parsed.get("fields", {}) or {}
        masked_fields = mask_sensitive_fields(raw_fields)
        warnings = []
        if masked_fields != raw_fields:
            warnings.append("One or more ID-number-shaped fields were masked to their last 4 characters.")

        doc_type = parsed.get("document_type", "other")
        try:
            doc_type = IDDocumentType(doc_type)
        except ValueError:
            doc_type = "unknown"

        return DocumentExtractionResult(document_type=doc_type, fields=masked_fields, warnings=warnings)


def get_vision_client() -> DocumentVisionClient:
    backend = os.getenv("VISION_BACKEND", "stub")
    if backend == "ollama-vlm":
        return OllamaVisionClient()
    return StubDocumentVisionClient()
