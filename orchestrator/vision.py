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
import io
import logging
import os
import re
import threading
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
_DOB_RE = re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b")


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
# EasyOCR — real, in-process OCR. No external binary (unlike Tesseract),
# just `pip install easyocr`. This is the recommended default: it actually
# reads the document instead of guessing from a filename or depending on a
# multi-GB vision-language model pull. Select with VISION_BACKEND=easyocr.
# ---------------------------------------------------------------------------

_reader_lock = threading.Lock()
_reader_cache: dict[str, "object"] = {}

_DOC_TYPE_TEXT_HINTS = {
    IDDocumentType.AADHAAR: ["unique identification", "aadhaar", "aadhar", "government of india"],
    IDDocumentType.PAN: ["income tax department", "permanent account number", "pan"],
    IDDocumentType.DRIVING_LICENSE: ["driving licence", "driving license", "transport", "motor vehicles"],
}

# Lines that are just document boilerplate, not a name/address field worth
# surfacing — filtered out before guessing which line is the "name".
_BOILERPLATE_LINE_HINTS = [
    "government of india",
    "unique identification authority",
    "income tax department",
    "permanent account number",
    "driving licence",
    "transport department",
    "date of birth",
    "signature",
    "govt of india",
]


def _get_easyocr_reader(languages: tuple[str, ...]):
    cache_key = ",".join(languages)
    if cache_key in _reader_cache:
        return _reader_cache[cache_key]
    with _reader_lock:
        if cache_key not in _reader_cache:
            import easyocr

            logger.info(f"Loading EasyOCR reader (first request will be slow) — languages={languages}")
            # verbose=False: EasyOCR's download-progress bar prints a
            # Unicode block character that crashes on Windows' default
            # console codepage (cp1252) mid-download — found by testing
            # this for real, not theoretical. Suppress it; we log our own
            # progress line above instead.
            _reader_cache[cache_key] = easyocr.Reader(list(languages), gpu=False, verbose=False)
    return _reader_cache[cache_key]


def _guess_document_type(raw_text: str, filename: str) -> IDDocumentType | Literal["unknown"]:
    lowered = raw_text.lower()
    for candidate, hints in _DOC_TYPE_TEXT_HINTS.items():
        if any(h in lowered for h in hints):
            return candidate
    name = filename.lower()
    for candidate, hints in _FILENAME_TYPE_HINTS.items():
        if any(h in name for h in hints):
            return candidate
    return "unknown"


def _normalize_for_match(text: str) -> str:
    """Collapses whitespace and lowercases — OCR frequently merges/drops
    spaces (e.g. "GOVERNMENT OF INDIA" -> "GOVERNMENTOF INDIA"), so exact
    substring matching against boilerplate phrases silently fails unless
    both sides are normalized the same way. Found by testing against a
    real (synthetic) OCR pass, not assumed upfront."""
    return re.sub(r"\s+", "", text).lower()


_BOILERPLATE_NORMALIZED = [_normalize_for_match(h) for h in _BOILERPLATE_LINE_HINTS]

# A plausible person's name: 2-4 space-separated alphabetic words, each
# capitalized-looking (ALLCAPS or Title Case) — used to prefer genuine name
# lines over boilerplate that merely survives the boilerplate filter.
_NAME_SHAPE_RE = re.compile(r"^([A-Z][a-zA-Z]*\s){1,3}[A-Z][a-zA-Z]*$")


def _extract_fields_from_text(lines: list[str]) -> dict[str, str]:
    full_text = "\n".join(lines)
    fields: dict[str, str] = {}

    dob_match = _DOB_RE.search(full_text)
    if dob_match:
        fields["date_of_birth"] = dob_match.group(1)

    for line in lines:
        stripped = line.strip()
        if _AADHAAR_RE.search(stripped) or _PAN_RE.search(stripped) or _DL_RE.search(stripped):
            fields["id_number"] = stripped
            break

    # Best-effort name guess — a heuristic, not a claim of certainty, hence
    # "raw_text" is always included too so a human can verify rather than
    # trust this guess blindly. Prefer name-shaped lines (looks like "First
    # Last") over just "longest surviving line", since boilerplate that
    # slips past the (whitespace-normalized) filter is usually still
    # obviously not name-shaped.
    candidates = [
        line.strip()
        for line in lines
        if line.strip()
        and _normalize_for_match(line) not in _BOILERPLATE_NORMALIZED
        and not any(h in _normalize_for_match(line) for h in _BOILERPLATE_NORMALIZED)
        and not _AADHAAR_RE.search(line)
        and not _PAN_RE.search(line)
        and not _DOB_RE.search(line)
        and sum(c.isalpha() or c.isspace() for c in line) / max(len(line), 1) > 0.7
    ]
    name_shaped = [c for c in candidates if _NAME_SHAPE_RE.match(c)]
    if name_shaped:
        fields["name_guess"] = max(name_shaped, key=len)
    elif candidates:
        fields["name_guess"] = max(candidates, key=len)

    fields["raw_text"] = full_text
    return fields


class EasyOCRClient(DocumentVisionClient):
    def __init__(self, languages: tuple[str, ...] | None = None):
        env_langs = os.getenv("EASYOCR_LANGUAGES", "en,hi")
        self.languages = languages or tuple(lang.strip() for lang in env_langs.split(","))

    def extract(self, image_bytes: bytes, filename: str) -> DocumentExtractionResult:
        import numpy as np
        from PIL import Image

        reader = _get_easyocr_reader(self.languages)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = reader.readtext(np.array(image))

        lines = [text for (_bbox, text, confidence) in results if confidence > 0.3]
        if not lines:
            return DocumentExtractionResult(
                document_type="unknown",
                fields={},
                warnings=["OCR found no readable text — check the photo is in focus and well-lit."],
            )

        raw_fields = _extract_fields_from_text(lines)
        doc_type = _guess_document_type(raw_fields["raw_text"], filename)
        masked_fields = mask_sensitive_fields(raw_fields)

        warnings = ["Fields are OCR best-effort guesses — verify against the original document."]
        if masked_fields.get("id_number") != raw_fields.get("id_number"):
            warnings.append("The ID number field was masked to its last 4 characters.")

        return DocumentExtractionResult(document_type=doc_type, fields=masked_fields, warnings=warnings)


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
    if backend == "easyocr":
        return EasyOCRClient()
    if backend == "ollama-vlm":
        return OllamaVisionClient()
    return StubDocumentVisionClient()
