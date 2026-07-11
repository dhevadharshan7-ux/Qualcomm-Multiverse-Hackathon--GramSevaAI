"""Offline tests for ID-update classification and the vision-extraction PII mask.

The masking test matters most: it's the guardrail preventing a full Aadhaar/PAN
number from ever reaching the database or logs.
"""
from orchestrator.classifier import MockIntentClassifier
from orchestrator.vision import mask_sensitive_fields
from shared.enums import Channel, IDDocumentType, Intent
from shared.schemas import OrchestrateRequest

classifier = MockIntentClassifier()


def test_aadhaar_update_request_detected():
    req = OrchestrateRequest(
        transcript="I need to update my Aadhaar address, we moved villages",
        channel=Channel.VOICE,
    )
    result = classifier.classify(req)
    assert result.intent == Intent.ID_UPDATE_REQUEST
    assert result.fields["id_type"] == IDDocumentType.AADHAAR.value


def test_driving_licence_update_request_detected():
    req = OrchestrateRequest(transcript="My driving licence needs a correction", channel=Channel.FORM)
    result = classifier.classify(req)
    assert result.intent == Intent.ID_UPDATE_REQUEST
    assert result.fields["id_type"] == IDDocumentType.DRIVING_LICENSE.value


def test_mask_sensitive_fields_masks_aadhaar_shaped_value():
    masked = mask_sensitive_fields({"id_number": "1234 5678 9012", "name": "Ramesh Kumar"})
    assert masked["id_number"] == "********9012"
    assert masked["name"] == "Ramesh Kumar"


def test_mask_sensitive_fields_masks_pan_shaped_value():
    masked = mask_sensitive_fields({"pan": "ABCDE1234F"})
    assert masked["pan"] == "******234F"


def test_mask_sensitive_fields_leaves_short_values_alone():
    masked = mask_sensitive_fields({"date_of_birth": "1990-01-01", "address": "Ward 4, Rampur"})
    assert masked["date_of_birth"] == "1990-01-01"
    assert masked["address"] == "Ward 4, Rampur"
