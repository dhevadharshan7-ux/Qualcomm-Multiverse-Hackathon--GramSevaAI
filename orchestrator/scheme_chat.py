"""AI chatbot for government scheme/policy questions.

Two-layer guardrail against off-topic use, per DATA_GOVERNANCE.md's spirit
(AI should not pretend authority it doesn't have, and should have a
narrow, enforced scope):

  1. Code-level topic gate (`_is_on_topic`) — runs BEFORE any model call.
     Clearly off-topic questions are refused with a fixed template and
     never reach the LLM at all. This can't be prompt-injected around,
     because there's no prompt for an attacker's text to hide instructions
     in until *after* this gate passes.
  2. Even once past the gate, the model is instructed to answer ONLY from
     the retrieved scheme catalog rows and to say so explicitly if the
     catalog doesn't cover the question — not to fall back on pretrained
     general knowledge about government schemes, which could be wrong or
     out of date.

Grounding: retrieves matching rows from the real `Scheme` table (owned by
the Node/Prisma backend, same Postgres server, `Gram_Seva_Ai` database —
see SCHEMES_DATABASE_URL) rather than letting the model invent scheme
names/benefits from pretraining.
"""
import logging
import os
import re
from abc import ABC, abstractmethod

import httpx
from pydantic import BaseModel
from sqlalchemy import create_engine, text

logger = logging.getLogger("gram_seva.scheme_chat")

DISCLAIMER = (
    "This answer is generated from our scheme catalog and may be incomplete or out of "
    "date — confirm final eligibility and required documents with your Panchayat office "
    "before applying."
)

REFUSAL_MESSAGE = (
    "I can only help with questions about government schemes, policies, eligibility, "
    "applications, and panchayat services. That question is outside what I'm able to "
    "answer here — for anything else, please contact your Panchayat office directly."
)

# Deliberately broad allow-list — false positives (an off-topic question
# that happens to contain "help" or "apply") just mean it reaches the
# LLM's own grounding instructions instead of being refused outright,
# which is the safe failure direction. False negatives (a genuine scheme
# question refused) are the worse failure, so keep this generous.
_ON_TOPIC_KEYWORDS = [
    "scheme", "yojana", "policy", "policies", "eligib", "apply", "application",
    "benefit", "subsidy", "pension", "loan", "insurance", "certificate",
    "panchayat", "government", "sarkari", "gov.in", "aadhaar", "aadhar", "pan card",
    "driving licence", "driving license", "ration", "welfare", "grievance",
    "scholarship", "pm-kisan", "pm kisan", "ayushman", "mgnrega", "jan dhan",
]


def _is_on_topic(question: str) -> bool:
    lowered = question.lower()
    return any(keyword in lowered for keyword in _ON_TOPIC_KEYWORDS)


class SchemeMatch(BaseModel):
    scheme_name: str
    description: str
    scheme_url: str | None = None


class ChatResponse(BaseModel):
    answer: str
    on_topic: bool
    matched_schemes: list[SchemeMatch] = []
    disclaimer: str | None = None


# ---------------------------------------------------------------------------
# Retrieval — reads the Node backend's Scheme table directly (read-only).
# Separate engine from shared/db.py's, since it's a different database on
# the same Postgres server (Gram_Seva_Ai, not gramseva).
# ---------------------------------------------------------------------------

_schemes_engine = None


def _get_schemes_engine():
    global _schemes_engine
    if _schemes_engine is None:
        url = os.getenv(
            "SCHEMES_DATABASE_URL",
            "postgresql+psycopg://postgres:Hackathon123@localhost:5432/Gram_Seva_Ai",
        )
        _schemes_engine = create_engine(url, pool_pre_ping=True, future=True)
    return _schemes_engine


def retrieve_relevant_schemes(question: str, limit: int = 5) -> list[SchemeMatch]:
    """Keyword search against schemeName/description. Falls back to an
    empty list (not an error) if the schemes DB is unreachable — the chat
    endpoint should degrade to 'I don't have that information' rather than
    500 just because a cross-database read failed."""
    words = [w for w in re.findall(r"[a-zA-Z]{3,}", question.lower()) if w not in _ON_TOPIC_KEYWORDS]
    if not words:
        words = [question.strip()]

    try:
        engine = _get_schemes_engine()
        with engine.connect() as conn:
            conditions = " OR ".join(f'"schemeName" ILIKE :w{i} OR description ILIKE :w{i}' for i in range(len(words)))
            params = {f"w{i}": f"%{w}%" for i, w in enumerate(words)}
            # SELECT * rather than naming schemeUrl explicitly — this table's
            # exact columns depend on which migrations have been applied to
            # whichever Gram_Seva_Ai backend copy is live (see RUNBOOK.md's
            # schema-drift note); schemeUrl may or may not exist yet.
            # Reading via row._mapping and .get() tolerates either shape.
            rows = conn.execute(
                text(f'SELECT * FROM "Scheme" WHERE {conditions} LIMIT :limit'),
                {**params, "limit": limit},
            ).fetchall()
        return [
            SchemeMatch(
                scheme_name=row._mapping["schemeName"],
                description=row._mapping["description"],
                scheme_url=row._mapping.get("schemeUrl"),
            )
            for row in rows
        ]
    except Exception:
        logger.warning("Could not query the Scheme table (Gram_Seva_Ai DB unreachable?)", exc_info=True)
        return []


# ---------------------------------------------------------------------------
# Answer generation
# ---------------------------------------------------------------------------


class SchemeChatClient(ABC):
    @abstractmethod
    def answer(self, question: str, schemes: list[SchemeMatch]) -> str: ...


class MockSchemeChatClient(SchemeChatClient):
    """Offline default — no LLM call, just formats the retrieved catalog
    rows directly. Genuinely useful for simple lookups, not just a stub."""

    def answer(self, question: str, schemes: list[SchemeMatch]) -> str:
        if not schemes:
            return (
                "I couldn't find anything matching that in our scheme catalog. Try asking "
                "about a specific scheme by name, or visit your Panchayat office for the "
                "full list of central and state schemes."
            )
        lines = [f"Here's what I found in our scheme catalog:\n"]
        for s in schemes:
            lines.append(f"• **{s.scheme_name}** — {s.description}" + (f" ({s.scheme_url})" if s.scheme_url else ""))
        return "\n".join(lines)


_CHAT_PROMPT = """You are the Gram Seva AI assistant for an Indian village panchayat office. \
A citizen has asked a question. Answer using ONLY the scheme information below — do not use \
any other knowledge about government schemes, since it may be outdated or wrong for this area. \
If the schemes below don't answer the question, say so plainly and suggest the citizen visit \
the Panchayat office, rather than guessing.

Scheme catalog matches:
{schemes_context}

Citizen's question: {question}

Answer in 2-4 sentences, plain language, no legal jargon."""


class OllamaSchemeChatClient(SchemeChatClient):
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "gemma2:4b")

    def answer(self, question: str, schemes: list[SchemeMatch]) -> str:
        if schemes:
            context = "\n".join(
                f"- {s.scheme_name}: {s.description}" + (f" ({s.scheme_url})" if s.scheme_url else "")
                for s in schemes
            )
        else:
            context = "(no matching schemes found in the catalog)"

        prompt = _CHAT_PROMPT.format(schemes_context=context, question=question)
        resp = httpx.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["response"].strip()


def get_chat_client() -> SchemeChatClient:
    backend = os.getenv("LLM_BACKEND", "mock")
    if backend == "ollama":
        return OllamaSchemeChatClient()
    return MockSchemeChatClient()


def ask(question: str, chat_client: SchemeChatClient | None = None) -> ChatResponse:
    if not _is_on_topic(question):
        return ChatResponse(answer=REFUSAL_MESSAGE, on_topic=False, matched_schemes=[], disclaimer=None)

    schemes = retrieve_relevant_schemes(question)
    client = chat_client or get_chat_client()

    try:
        answer_text = client.answer(question, schemes)
    except Exception:
        logger.warning("Chat model call failed, falling back to catalog-only answer", exc_info=True)
        answer_text = MockSchemeChatClient().answer(question, schemes)

    return ChatResponse(answer=answer_text, on_topic=True, matched_schemes=schemes, disclaimer=DISCLAIMER)
