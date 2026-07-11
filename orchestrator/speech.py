"""Speech-to-text client for the voice-intake path.

IMPORTANT ASSUMPTION — confirm/adjust before relying on this: Ollama's
standard API (`/api/generate`) does not natively transcribe audio; it's
built for text/vision generation. This client instead targets the
OpenAI-compatible `/v1/audio/transcriptions` multipart shape that most
local Whisper servers (whisper.cpp server, faster-whisper-server, and
common Ollama-fronting shims) expose. If your "Whisper running in Ollama"
setup serves a different path, set WHISPER_STT_URL accordingly — the
request/response shape here (multipart `file` in, `{"text": "..."}` out)
is the thing most likely to need adjusting for your exact setup.
"""
import logging
import os
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
    if backend == "whisper":
        return WhisperHTTPClient()
    return StubSpeechToTextClient()
