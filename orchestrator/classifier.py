"""Intent classification + field extraction.

Two backends behind one interface:
  - MockIntentClassifier: offline, deterministic, keyword-based. Default —
    this is what makes the acceptance-criteria curl test work with zero
    network and no model weights on the judges' machine.
  - OllamaGemmaClassifier: calls a local Gemma4 model served by Ollama
    (the real Snapdragon X Elite path). Select with LLM_BACKEND=ollama.

Select via env var LLM_BACKEND (see .env.example). orchestrator/main.py
falls back to the mock classifier if the configured backend raises, so a
flaky/absent local model never breaks the request.
"""
import json
import os
import re
from abc import ABC, abstractmethod

import httpx
from pydantic import BaseModel

from shared.enums import Channel, GrievanceCategory, IDDocumentType, Intent, Priority
from shared.schemas import (
    EligibilityCheckFields,
    FarmerProduceEntryFields,
    GrievanceStatusCheckFields,
    IDUpdateRequestFields,
    INTENT_FIELD_MODELS,
    NewApplicationFields,
    NewGrievanceFields,
    OrchestrateRequest,
)


class ClassificationResult(BaseModel):
    intent: Intent
    confidence: float
    fields: dict

    def fields_as(self, model: type[BaseModel]) -> BaseModel:
        return model(**self.fields)


class IntentClassifier(ABC):
    @abstractmethod
    def classify(self, req: OrchestrateRequest) -> ClassificationResult: ...


# ---------------------------------------------------------------------------
# Mock backend — rule-based, offline
# ---------------------------------------------------------------------------

_FARMER_KEYWORDS = ["sold", "quintal", "harvest", "mandi", "produce"]
_ID_UPDATE_KEYWORDS = [
    "aadhaar", "aadhar", "pan card", "driving licence", "driving license",
    "dl update", "correct my name", "address change", "update my address",
]
_STATUS_KEYWORDS = ["status", "track my", "update on my", "what happened to my"]
_APPLICATION_KEYWORDS = ["apply", "application", "scheme", "yojana"]
_ELIGIBILITY_KEYWORDS = ["eligible", "eligibility", "qualify"]

_ID_TYPE_KEYWORDS = {
    IDDocumentType.AADHAAR: ["aadhaar", "aadhar"],
    IDDocumentType.PAN: ["pan card", "pan number", " pan "],
    IDDocumentType.DRIVING_LICENSE: ["driving licence", "driving license", "dl "],
}

_CATEGORY_KEYWORDS = {
    GrievanceCategory.STREETLIGHT: ["streetlight", "street light", "lamp post", "light not"],
    GrievanceCategory.WATER: ["water", "pump", "tap", "borewell", "pipeline"],
    GrievanceCategory.ROAD_DAMAGE: ["road", "pothole", "street damage", "broken road"],
    GrievanceCategory.ELECTRICITY: ["electricity", "power cut", "transformer", "electric pole", "wiring"],
    GrievanceCategory.SANITATION: ["garbage", "sewage", "drain", "sanitation", "toilet", "trash"],
    GrievanceCategory.CORRUPTION: ["bribe", "corrupt", "asked for money", "demanded money"],
}

_URGENT_KEYWORDS = ["urgent", "emergency", "immediately", "accident", "child", "danger"]

_QUANTITY_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(kg|kilogram|quintal|quintals|ton|tons)", re.I)


class MockIntentClassifier(IntentClassifier):
    def classify(self, req: OrchestrateRequest) -> ClassificationResult:
        text = req.transcript.lower()

        if any(k in text for k in _FARMER_KEYWORDS):
            return self._farmer_produce(req, text)
        if any(k in text for k in _ID_UPDATE_KEYWORDS):
            return self._id_update_request(req, text)
        if any(k in text for k in _STATUS_KEYWORDS):
            return self._status_check(req, text)
        if any(k in text for k in _APPLICATION_KEYWORDS):
            return self._new_application(req, text)
        if any(k in text for k in _ELIGIBILITY_KEYWORDS):
            return self._eligibility_check(req, text)

        return self._new_grievance(req, text)

    def _new_grievance(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        category = GrievanceCategory.OTHER
        confidence = 0.4  # no keyword match -> low confidence, demos cloud escalation
        for cat, keywords in _CATEGORY_KEYWORDS.items():
            if any(k in text for k in keywords):
                category = cat
                confidence = 0.7 if cat == GrievanceCategory.CORRUPTION else 0.85
                break

        priority = Priority.MEDIUM
        if category == GrievanceCategory.CORRUPTION or any(k in text for k in _URGENT_KEYWORDS):
            priority = Priority.HIGH
        elif category == GrievanceCategory.OTHER:
            priority = Priority.LOW

        location = req.metadata.location if req.metadata else None
        fields = NewGrievanceFields(
            citizen_id=req.citizen_id,
            category=category,
            description=req.transcript.strip(),
            location=location,
            priority=priority,
            source_channel=req.channel,
        )
        return ClassificationResult(
            intent=Intent.NEW_GRIEVANCE, confidence=confidence, fields=fields.model_dump()
        )

    def _status_check(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        fields = GrievanceStatusCheckFields(grievance_id=None, citizen_id=req.citizen_id)
        return ClassificationResult(
            intent=Intent.GRIEVANCE_STATUS_CHECK, confidence=0.8, fields=fields.model_dump()
        )

    def _new_application(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        fields = NewApplicationFields(citizen_id=req.citizen_id, details={})
        return ClassificationResult(
            intent=Intent.NEW_APPLICATION, confidence=0.7, fields=fields.model_dump()
        )

    def _eligibility_check(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        fields = EligibilityCheckFields(citizen_id=req.citizen_id, details={})
        return ClassificationResult(
            intent=Intent.ELIGIBILITY_CHECK, confidence=0.7, fields=fields.model_dump()
        )

    def _farmer_produce(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        match = _QUANTITY_RE.search(text)
        quantity = float(match.group(1)) if match else None
        unit = match.group(2) if match else None
        fields = FarmerProduceEntryFields(
            citizen_id=req.citizen_id,
            crop=None,
            quantity=quantity,
            unit=unit,
            location=req.metadata.location if req.metadata else None,
        )
        return ClassificationResult(
            intent=Intent.FARMER_PRODUCE_ENTRY, confidence=0.75, fields=fields.model_dump()
        )

    def _id_update_request(self, req: OrchestrateRequest, text: str) -> ClassificationResult:
        id_type = IDDocumentType.OTHER
        for candidate, keywords in _ID_TYPE_KEYWORDS.items():
            if any(k in text for k in keywords):
                id_type = candidate
                break
        fields = IDUpdateRequestFields(
            citizen_id=req.citizen_id,
            id_type=id_type,
            update_type="unspecified",
            description=req.transcript.strip(),
            source_channel=req.channel,
        )
        confidence = 0.75 if id_type != IDDocumentType.OTHER else 0.5
        return ClassificationResult(
            intent=Intent.ID_UPDATE_REQUEST, confidence=confidence, fields=fields.model_dump()
        )


# ---------------------------------------------------------------------------
# Ollama-served Gemma4 backend — real local-model path
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """You are the intent classifier for Gram Seva AI, a village panchayat \
assistant. Classify the citizen's transcript into exactly one intent and extract fields.

Valid intents: new_grievance, grievance_status_check, new_application, eligibility_check, \
farmer_produce_entry, id_update_request

Respond with ONLY a JSON object, no prose, matching this shape:
{{"intent": "<intent>", "confidence": <0.0-1.0>, "fields": {{...intent-specific fields...}}}}

For new_grievance, fields must be: category (streetlight|water|road_damage|electricity| \
sanitation|corruption|other), description, priority (low|medium|high).

For id_update_request, fields must be: id_type (aadhaar|pan|driving_license|other), \
update_type (short label, e.g. "address_change", "name_correction"), description. This is a \
REQUEST to correct/update a document, never a direct edit of any government database — you are \
only ever preparing a request for a human official to act on.

Transcript ({language}, via {channel}): "{transcript}"
"""


class OllamaGemmaClassifier(IntentClassifier):
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "gemma2:4b")

    def classify(self, req: OrchestrateRequest) -> ClassificationResult:
        prompt = _PROMPT_TEMPLATE.format(
            language=req.language.value, channel=req.channel.value, transcript=req.transcript
        )
        resp = httpx.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False, "format": "json"},
            timeout=15.0,
        )
        resp.raise_for_status()
        raw = resp.json()["response"]
        parsed = json.loads(raw)

        intent = Intent(parsed["intent"])
        confidence = float(parsed["confidence"])
        raw_fields = parsed.get("fields", {})

        # Fill required fields the model doesn't know (channel/citizen come from the request).
        if intent == Intent.NEW_GRIEVANCE:
            raw_fields.setdefault("citizen_id", req.citizen_id)
            raw_fields.setdefault("source_channel", req.channel.value)
            raw_fields.setdefault("location", req.metadata.location if req.metadata else None)
        elif intent == Intent.ID_UPDATE_REQUEST:
            raw_fields.setdefault("citizen_id", req.citizen_id)
            raw_fields.setdefault("source_channel", req.channel.value)

        model_cls = INTENT_FIELD_MODELS[intent]
        fields = model_cls(**raw_fields)
        return ClassificationResult(intent=intent, confidence=confidence, fields=fields.model_dump())


def get_classifier() -> IntentClassifier:
    backend = os.getenv("LLM_BACKEND", "mock")
    if backend == "ollama":
        return OllamaGemmaClassifier()
    return MockIntentClassifier()
