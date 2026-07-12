"""Orchestrator core — the compute-hub API for Gram Seva AI.

Single FastAPI app for the hackathon demo: hosts /orchestrate (intent
classification + routing) and mounts the Grievance Platform router. Runs
entirely on the Snapdragon X Elite AI PC with zero internet dependency.
"""
import logging
import uuid

from dotenv import load_dotenv

# Must run before any project-local import below — several modules
# (shared.db, orchestrator.routing) read env vars as module-level constants
# at import time, so .env has to be loaded first or those reads silently
# fall back to hardcoded defaults no matter what .env says. This was a real
# bug: .env was never actually being loaded anywhere in the codebase.
load_dotenv()

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError

from dal.factory import get_dal
from dal.interface import DAL
from grievance import service as grievance_service
from grievance.main import router as grievance_router
from grievance.sync import sync_to_gov_cloud
from id_services import service as id_service
from id_services.main import router as id_services_router
from orchestrator.classifier import IntentClassifier, MockIntentClassifier, get_classifier
from orchestrator.logging_config import configure_logging, log_routing_decision
from orchestrator.routing import route
from orchestrator.scheme_chat import ChatResponse, SchemeChatClient, ask, get_chat_client
from orchestrator.speech import SpeechToTextClient, get_speech_client
from shared.db import get_db
from shared.enums import Channel, Intent, Language
from shared.schemas import (
    Downstream,
    IDUpdateRequestFields,
    NewGrievanceFields,
    OrchestrateRequest,
    OrchestrateResponse,
)

configure_logging()
logger = logging.getLogger("gram_seva.orchestrator")

app = FastAPI(title="Gram Seva AI Orchestrator", version="0.1.0")

# LAN-only hackathon deployment (panchayat office network, no public exposure).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(grievance_router, prefix="/grievances", tags=["grievances"])
app.include_router(id_services_router, prefix="/id-requests", tags=["id-requests"])

_mock_classifier = MockIntentClassifier()


def _classify_with_fallback(req: OrchestrateRequest, classifier: IntentClassifier):
    try:
        return classifier.classify(req)
    except Exception:
        logger.warning("configured classifier failed, falling back to mock", exc_info=True)
        return _mock_classifier.classify(req)


def _handle_orchestration(
    req: OrchestrateRequest, db, dal: DAL, classifier: IntentClassifier
) -> OrchestrateResponse:
    request_id = str(uuid.uuid4())
    classification = _classify_with_fallback(req, classifier)
    final, routed_to = route(req, classification)

    downstream = Downstream()
    if final.intent == Intent.NEW_GRIEVANCE:
        grievance_fields = final.fields_as(NewGrievanceFields)
        row = grievance_service.create_grievance(db, dal, grievance_fields)
        sync_to_gov_cloud(str(row.id))
        downstream = Downstream(action="grievance_created", resource_id=str(row.id))
    elif final.intent == Intent.ID_UPDATE_REQUEST:
        id_fields = final.fields_as(IDUpdateRequestFields)
        row = id_service.create_request(db, id_fields)
        downstream = Downstream(action="id_update_request_created", resource_id=str(row.id))

    log_routing_decision(
        logger,
        request_id=request_id,
        channel=req.channel.value,
        language=req.language.value,
        intent=final.intent.value,
        confidence=final.confidence,
        routed_to=routed_to.value,
        downstream_action=downstream.action,
    )

    return OrchestrateResponse(
        request_id=request_id,
        intent=final.intent,
        confidence=final.confidence,
        routed_to=routed_to.value,
        extracted_fields=final.fields,
        downstream=downstream,
    )


@app.post("/orchestrate", response_model=OrchestrateResponse)
def orchestrate(
    req: OrchestrateRequest,
    db=Depends(get_db),
    dal: DAL = Depends(get_dal),
    classifier: IntentClassifier = Depends(get_classifier),
):
    return _handle_orchestration(req, db, dal, classifier)


@app.post("/orchestrate/voice", response_model=OrchestrateResponse)
async def orchestrate_voice(
    audio: UploadFile = File(...),
    language: Language = Form(Language.EN),
    channel: Channel = Form(Channel.VOICE),
    citizen_id: str | None = Form(None),
    db=Depends(get_db),
    dal: DAL = Depends(get_dal),
    classifier: IntentClassifier = Depends(get_classifier),
    speech_client: SpeechToTextClient = Depends(get_speech_client),
):
    """Voice-in entry point: audio -> Whisper transcript -> same orchestration
    pipeline as /orchestrate. Kept as a separate endpoint (not folded into
    /orchestrate) so the transcript is always visible in the routing-decision
    log for debugging a bad transcription vs. a bad classification."""
    audio_bytes = await audio.read()
    try:
        transcription = speech_client.transcribe(audio_bytes, audio.filename or "audio")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"speech-to-text failed: {e}") from e

    req = OrchestrateRequest(
        transcript=transcription.transcript,
        language=language,
        channel=channel,
        citizen_id=citizen_id,
    )
    return _handle_orchestration(req, db, dal, classifier)


@app.websocket("/ws/orchestrate")
async def orchestrate_ws(websocket: WebSocket):
    await websocket.accept()
    dal = get_dal()
    classifier = get_classifier()
    db_gen = get_db()
    db = next(db_gen)
    try:
        while True:
            payload = await websocket.receive_json()
            try:
                req = OrchestrateRequest(**payload)
            except ValidationError as e:
                await websocket.send_json({"error": e.errors()})
                continue
            response = _handle_orchestration(req, db, dal, classifier)
            await websocket.send_json(response.model_dump())
    except WebSocketDisconnect:
        pass
    finally:
        db_gen.close()


class ChatRequest(BaseModel):
    question: str


@app.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    chat_client: SchemeChatClient = Depends(get_chat_client),
):
    """Scheme/policy Q&A — see orchestrator/scheme_chat.py for the
    topic-gate + grounding guardrails. Off-topic questions never reach the
    model at all."""
    response = ask(req.question, chat_client)
    logger.info(
        "chat_request",
        extra={
            "extra_fields": {
                "on_topic": response.on_topic,
                "matched_schemes": len(response.matched_schemes),
            }
        },
    )
    return response


@app.post("/chat/voice", response_model=ChatResponse)
async def chat_voice(
    audio: UploadFile = File(...),
    speech_client: SpeechToTextClient = Depends(get_speech_client),
    chat_client: SchemeChatClient = Depends(get_chat_client),
):
    audio_bytes = await audio.read()
    try:
        transcription = speech_client.transcribe(audio_bytes, audio.filename or "audio")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"speech-to-text failed: {e}") from e
    return ask(transcription.transcript, chat_client)


@app.get("/health")
def health():
    return {"status": "ok"}
