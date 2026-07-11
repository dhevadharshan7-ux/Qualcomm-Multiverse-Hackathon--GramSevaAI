"""
Whisper STT server for Gram Seva AI.

Exposes POST /v1/audio/transcriptions with the same multipart shape as the
OpenAI API so `orchestrator/speech.py`'s WhisperHTTPClient works unchanged.

Usage:
    .venv\\Scripts\\python.exe whisper_server.py
    .venv\\Scripts\\python.exe whisper_server.py --model large-v3-turbo   # best quality
    .venv\\Scripts\\python.exe whisper_server.py --model base             # fastest

The first run downloads the chosen model from Hugging Face (~150 MB for
`base`, ~1.5 GB for `large-v3-turbo`).  Keep it running alongside uvicorn.
"""

import argparse
import logging
import os
import tempfile

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("whisper_server")

app = FastAPI(title="Gram Seva AI — Local Whisper STT")
_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet — retry in a moment")
    return _model


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-large-v3-turbo"),  # ignored — we use what's loaded
    language: str | None = Form(default=None),
    response_format: str = Form(default="json"),
):
    """OpenAI-compatible transcription endpoint (same shape as api.openai.com)."""
    whisper = get_model()

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    # faster-whisper needs a file path, so write to a temp file first
    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        kwargs: dict = {}
        if language:
            kwargs["language"] = language
        segments, info = whisper.transcribe(tmp_path, beam_size=5, **kwargs)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        detected_lang = info.language
    finally:
        os.unlink(tmp_path)

    logger.info(
        "Transcribed %d bytes  lang=%s  text=%r",
        len(audio_bytes),
        detected_lang,
        text[:80],
    )

    # OpenAI-compatible response shape: {"text": "...", "language": "en"}
    return JSONResponse({"text": text, "language": detected_lang})


def main():
    parser = argparse.ArgumentParser(description="Gram Seva AI local Whisper STT server")
    parser.add_argument(
        "--model",
        default=os.getenv("WHISPER_LOCAL_MODEL", "base"),
        choices=[
            "tiny", "tiny.en",
            "base", "base.en",
            "small", "small.en",
            "medium", "medium.en",
            "large-v1", "large-v2", "large-v3", "large-v3-turbo",
            "distil-small.en", "distil-medium.en", "distil-large-v2", "distil-large-v3",
        ],
        help=(
            "faster-whisper model to load (default: base — fast & small download; "
            "use large-v3-turbo for best quality at ~1.5 GB)"
        ),
    )
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0 for LAN)")
    parser.add_argument("--port", type=int, default=9000, help="Port (default: 9000)")
    parser.add_argument(
        "--device",
        default="cpu",
        choices=["cpu", "cuda", "auto"],
        help="Compute device (default: cpu)",
    )
    parser.add_argument(
        "--compute-type",
        default="int8",
        choices=["int8", "int8_float16", "float16", "float32"],
        help="Quantization level — int8 is fastest on CPU (default: int8)",
    )
    args = parser.parse_args()

    global _model
    logger.info(
        "Loading faster-whisper model '%s' on device=%s compute_type=%s …",
        args.model, args.device, args.compute_type,
    )
    _model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    logger.info("Model ready ✓  Server starting at http://%s:%d", args.host, args.port)

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
