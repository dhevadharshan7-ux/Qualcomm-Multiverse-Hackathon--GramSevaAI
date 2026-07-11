"""Pydantic models for the orchestrator's public contract (CONTRACT.md §1-§2).

These are the shapes Rajesh's voice/WhatsApp pipeline sends and receives.
Changing a field here is a breaking change across the team — coordinate first.
"""
from datetime import datetime
from typing import Any, Optional, Union

from pydantic import BaseModel, Field

from shared.enums import Channel, GrievanceCategory, IDDocumentType, Intent, Language, Priority


class Metadata(BaseModel):
    device: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[datetime] = None


class OrchestrateRequest(BaseModel):
    transcript: str
    language: Language = Language.EN
    channel: Channel
    citizen_id: Optional[str] = None
    metadata: Optional[Metadata] = None


class NewGrievanceFields(BaseModel):
    citizen_id: Optional[str] = None
    category: GrievanceCategory
    description: str
    location: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    source_channel: Channel


class GrievanceStatusCheckFields(BaseModel):
    grievance_id: Optional[str] = None
    citizen_id: Optional[str] = None


class NewApplicationFields(BaseModel):
    scheme_name: Optional[str] = None
    citizen_id: Optional[str] = None
    details: dict[str, Any] = Field(default_factory=dict)


class EligibilityCheckFields(BaseModel):
    scheme_name: Optional[str] = None
    citizen_id: Optional[str] = None
    details: dict[str, Any] = Field(default_factory=dict)


class FarmerProduceEntryFields(BaseModel):
    citizen_id: Optional[str] = None
    crop: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None


class IDUpdateRequestFields(BaseModel):
    """A REQUEST to correct/update an ID document — never a direct write to
    UIDAI/NSDL/Parivahan. See id_services/ for the facilitation-only design."""

    citizen_id: Optional[str] = None
    id_type: IDDocumentType
    update_type: str
    description: str
    source_channel: Channel


ExtractedFields = Union[
    NewGrievanceFields,
    GrievanceStatusCheckFields,
    NewApplicationFields,
    EligibilityCheckFields,
    FarmerProduceEntryFields,
    IDUpdateRequestFields,
]

# Maps each Intent to the Pydantic model that shapes its extracted_fields.
INTENT_FIELD_MODELS: dict[Intent, type[BaseModel]] = {
    Intent.NEW_GRIEVANCE: NewGrievanceFields,
    Intent.GRIEVANCE_STATUS_CHECK: GrievanceStatusCheckFields,
    Intent.NEW_APPLICATION: NewApplicationFields,
    Intent.ELIGIBILITY_CHECK: EligibilityCheckFields,
    Intent.FARMER_PRODUCE_ENTRY: FarmerProduceEntryFields,
    Intent.ID_UPDATE_REQUEST: IDUpdateRequestFields,
}


class Downstream(BaseModel):
    action: str = "none"
    resource_id: Optional[str] = None


class OrchestrateResponse(BaseModel):
    request_id: str
    intent: Intent
    confidence: float
    routed_to: str
    extracted_fields: dict[str, Any]
    downstream: Downstream
