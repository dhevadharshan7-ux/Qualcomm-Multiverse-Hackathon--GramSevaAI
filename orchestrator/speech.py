"""Speech-to-text client for the voice-intake path.

Three backends:
  - stub (default): raises a clear error, makes it obvious nothing is wired.
  - faster_whisper: runs Whisper **in-process** via the `faster-whisper`
    library (CTranslate2) — no separate server, no HTTP endpoint to guess
    at. This is the recommended default for local dev: `pip install` and
    go, works fully offline once the model is cached. Picked over the
    Ollama-hosted "whisper" model some setups have pulled, which is
    frequently a mislabeled text LLM, not a real ASR model — see
    RUNBOOK.md §3.3 for how that was discovered.
  - whisper: HTTP client for an OpenAI-compatible `/v1/audio/transcriptions`
    server (whisper.cpp server, faster-whisper-server run as its own
    process, etc.) if you'd rather run STT on a separate machine/process.
"""
import io
import logging
import os
import threading
from abc import ABC, abstractmethod

import httpx
from pydantic import BaseModel

logger = logging.getLogger("gram_seva.speech")


class TranscriptionResult(BaseModel):
    transcript: str
    language: str | None = None


class SpeechToTextClient(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes: bytes, filename: str) -> TranscriptionResult: ...


class StubSpeechToTextClient(SpeechToTextClient):
    """Offline default — makes it obvious no STT backend is wired up yet,
    rather than silently returning nonsense."""

    def transcribe(self, audio_bytes: bytes, filename: str) -> TranscriptionResult:
        raise RuntimeError(
            "No speech-to-text backend configured (STT_BACKEND=stub). "
            "Set STT_BACKEND=whisper and WHISPER_STT_URL to your local Whisper "
            "server's transcription endpoint to enable voice intake."
        )


_model_lock = threading.Lock()
_model_cache: dict[str, "object"] = {}


def _get_whisper_model():
    """Lazily loads and caches the WhisperModel — loading takes several
    seconds, so this must happen once per process, not per request."""
    model_size = os.getenv("FASTER_WHISPER_MODEL", "base")
    device = os.getenv("FASTER_WHISPER_DEVICE", "cpu")
    compute_type = os.getenv("FASTER_WHISPER_COMPUTE_TYPE", "int8")
    cache_key = f"{model_size}:{device}:{compute_type}"

    if cache_key in _model_cache:
        return _model_cache[cache_key]

    with _model_lock:
        if cache_key not in _model_cache:
            from faster_whisper import WhisperModel

            logger.info(
                "Loading faster-whisper model (first request will be slow) — "
                f"model={model_size} device={device} compute_type={compute_type}"
            )
            _model_cache[cache_key] = WhisperModel(model_size, device=device, compute_type=compute_type)
    return _model_cache[cache_key]


class FasterWhisperClient(SpeechToTextClient):
    """In-process Whisper via CTranslate2 — no server, no network call.

    Audio decoding (webm/opus from the browser's MediaRecorder, wav, etc.)
    is handled internally by faster-whisper via PyAV, which bundles its own
    ffmpeg libraries — no separate ffmpeg install needed.
    """

    def transcribe(self, audio_bytes: bytes, filename: str) -> TranscriptionResult:
        model = _get_whisper_model()
        segments, info = model.transcribe(io.BytesIO(audio_bytes), beam_size=5)
        transcript = "".join(segment.text for segment in segments).strip()
        if not transcript:
            raise RuntimeError(
                "Whisper produced an empty transcript — check the recording has audio "
                "and isn't silent/too short."
            )
        return TranscriptionResult(transcript=transcript, language=info.language)


class WhisperHTTPClient(SpeechToTextClient):
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or os.getenv(
            "WHISPER_STT_URL", "http://localhost:11434/v1/audio/transcriptions"
        )
        self.model = model or os.getenv("WHISPER_MODEL", "whisper-large-v3-turbo")

    def transcribe(self, audio_bytes: bytes, filename: str) -> TranscriptionResult:
        resp = httpx.post(
            self.base_url,
            data={"model": self.model},
            files={"file": (filename, audio_bytes)},
            timeout=60.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        return TranscriptionResult(transcript=payload["text"], language=payload.get("language"))


def get_speech_client() -> SpeechToTextClient:
    backend = os.getenv("STT_BACKEND", "stub")
    if backend == "faster_whisper":
        return FasterWhisperClient()
    if backend == "whisper":
        return WhisperHTTPClient()
    return StubSpeechToTextClient()
