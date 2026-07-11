"""Offline unit tests for the mock classifier. No DB, no network."""
from orchestrator.classifier import MockIntentClassifier
from shared.enums import Channel, GrievanceCategory, Intent
from shared.schemas import OrchestrateRequest

classifier = MockIntentClassifier()


def test_streetlight_grievance_high_confidence():
    req = OrchestrateRequest(
        transcript="The streetlight near the temple has not worked for a week",
        channel=Channel.VOICE,
    )
    result = classifier.classify(req)
    assert result.intent == Intent.NEW_GRIEVANCE
    assert result.fields["category"] == GrievanceCategory.STREETLIGHT.value
    assert result.confidence >= 0.6


def test_ambiguous_transcript_low_confidence_triggers_escalation_path():
    req = OrchestrateRequest(transcript="something is wrong near my house", channel=Channel.FORM)
    result = classifier.classify(req)
    assert result.intent == Intent.NEW_GRIEVANCE
    assert result.confidence < 0.6


def test_status_check_intent():
    req = OrchestrateRequest(
        transcript="What is the status of my complaint?", channel=Channel.WHATSAPP, citizen_id="+919900011122"
    )
    result = classifier.classify(req)
    assert result.intent == Intent.GRIEVANCE_STATUS_CHECK
    assert result.fields["citizen_id"] == "+919900011122"


def test_corruption_grievance_forced_high_priority():
    req = OrchestrateRequest(
        transcript="The officer at the counter demanded money for my certificate",
        channel=Channel.VOICE,
    )
    result = classifier.classify(req)
    assert result.fields["category"] == GrievanceCategory.CORRUPTION.value
    assert result.fields["priority"] == "high"
