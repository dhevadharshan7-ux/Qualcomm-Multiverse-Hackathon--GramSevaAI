"""Canonical enums shared across orchestrator, dal, and grievance modules.

Single source of truth for the wire-level string values defined in CONTRACT.md.
Do not redefine these in a sub-module — import from here.
"""
from enum import Enum


class Intent(str, Enum):
    NEW_GRIEVANCE = "new_grievance"
    GRIEVANCE_STATUS_CHECK = "grievance_status_check"
    NEW_APPLICATION = "new_application"
    ELIGIBILITY_CHECK = "eligibility_check"
    FARMER_PRODUCE_ENTRY = "farmer_produce_entry"
    ID_UPDATE_REQUEST = "id_update_request"


class Channel(str, Enum):
    VOICE = "voice"
    WHATSAPP = "whatsapp"
    FORM = "form"


class Language(str, Enum):
    EN = "en"
    HI = "hi"
    KN = "kn"
    PA = "pa"
    MR = "mr"
    TA = "ta"


class GrievanceCategory(str, Enum):
    STREETLIGHT = "streetlight"
    WATER = "water"
    ROAD_DAMAGE = "road_damage"
    ELECTRICITY = "electricity"
    SANITATION = "sanitation"
    CORRUPTION = "corruption"
    OTHER = "other"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class GrievanceStatus(str, Enum):
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class RouteTarget(str, Enum):
    LOCAL = "local"
    CLOUD_ESCALATED = "cloud_escalated"


class DeviceReadingSource(str, Enum):
    SIMULATED = "simulated"
    LIVE = "live"


class IDDocumentType(str, Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    DRIVING_LICENSE = "driving_license"
    OTHER = "other"


class IDRequestStatus(str, Enum):
    SUBMITTED = "submitted"
    DOCUMENT_REVIEW = "document_review"
    READY_FOR_SUBMISSION = "ready_for_submission"
    SUBMITTED_TO_AUTHORITY = "submitted_to_authority"
    COMPLETED = "completed"
    REJECTED = "rejected"
