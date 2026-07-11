"""Confidence-based routing: local Gemma4 result vs. cloud escalation.

CONTRACT.md: cloud_escalate() is a stub for this hackathon pass — it must
never be a hard dependency (the AI Cloud 100 is optional infra), so it's
called synchronously here but is itself fully mocked with no network call.
"""
import logging
import os

from orchestrator.classifier import ClassificationResult
from shared.enums import RouteTarget
from shared.schemas import OrchestrateRequest

logger = logging.getLogger("gram_seva.orchestrator")

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))


def cloud_escalate(req: OrchestrateRequest, result: ClassificationResult) -> ClassificationResult:
    """Stub for the Qualcomm AI Cloud 100 escalation path.

    Real implementation later: ship the transcript to a larger cloud-hosted
    model when local confidence is too low. For the hackathon demo this
    just simulates a confidence boost so the routing decision is visible
    end-to-end without a real cloud dependency.
    """
    logger.info(
        "cloud_escalate stub invoked",
        extra={"extra_fields": {"intent": result.intent.value, "local_confidence": result.confidence}},
    )
    return ClassificationResult(
        intent=result.intent,
        confidence=max(result.confidence, 0.75),
        fields=result.fields,
    )


def route(
    req: OrchestrateRequest, result: ClassificationResult
) -> tuple[ClassificationResult, RouteTarget]:
    if result.confidence < CONFIDENCE_THRESHOLD:
        boosted = cloud_escalate(req, result)
        return boosted, RouteTarget.CLOUD_ESCALATED
    return result, RouteTarget.LOCAL
