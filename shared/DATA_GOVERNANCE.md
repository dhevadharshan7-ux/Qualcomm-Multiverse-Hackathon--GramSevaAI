# Gram Seva AI — Responsible AI, Data Governance & Security

This document is a contract, same standing as `CONTRACT.md`: every module that
touches citizen data or an AI model must comply with it. It exists because
this is a government-facing system handling Aadhaar/PAN/Driving Licence
data, income, caste, and location for people with limited ability to contest
a wrong decision — the bar for care here is higher than for a typical app.

---

## 1. Scope & non-negotiable boundary

**This system never writes to a government system of record** (UIDAI,
NSDL/UTIITSL, Parivahan, state land records). Every "update" or "correction"
flow (see `id_services/`) produces a *request* a human still has to carry to
a Common Service Centre / PAN Facilitation Centre / RTO in person. No code
in this repo should ever claim, in a citizen-facing message, that an
Aadhaar/PAN/DL record has been changed — only that a request has been
prepared and where to take it. This is a legal boundary, not a UX choice.

## 2. Consent & purpose limitation

- Voice recording only happens after an explicit, spoken or on-screen
  prompt telling the citizen they're being recorded and why (see the
  website's mic-consent copy). No passive/background listening, ever.
- Data collected for one purpose (e.g. a grievance) is not repurposed
  (e.g. for scheme marketing) without separate consent.

## 3. Data minimization

- **Raw audio is not retained past transcription.** `orchestrator/speech.py`
  passes audio straight to the STT backend and discards it after the
  transcript is returned — no audio file is written to disk or Postgres.
  If audio retention is ever needed for dispute review, it must be
  time-boxed (e.g. 30 days) and stated in this doc first, not added silently.
- **Full ID numbers are never persisted.** `orchestrator/vision.py`'s
  `mask_sensitive_fields()` reduces any Aadhaar/PAN/DL-shaped value to its
  last 4 characters *before* it reaches `id_services`' database write — see
  `tests/test_id_services.py` for the enforcement tests. Nothing upstream of
  that function should ever see, log, or forward the full number.
- AI chat/session logs (e.g. the Node backend's `AISession` table) should
  store only what's needed to debug a bad response — avoid echoing full
  citizen records into stored prompts where a summary or reference id
  would do.

## 4. Human-in-the-loop — AI proposes, a human decides

- Eligibility checks are **advisory**. An AI-generated eligibility
  explanation is not an approval; `Application.status` only moves to
  `APPROVED` via an authenticated officer action.
- ID-update requests always end at `submitted_to_authority` /
  `ready_for_submission` — the system's job stops at preparing the request
  and telling the citizen where to go; it does not and cannot mark one
  "completed" on its own.
- **Corruption-category grievances are handled verbatim.** No AI
  summarization/paraphrasing step should run on a corruption complaint's
  description before it reaches the Vigilance Cell — softened or
  "cleaned up" language can blunt evidentiary value. `grievance/service.py`
  stores `description` as submitted; keep it that way for this category
  specifically if any future summarization feature is added elsewhere.
- Corruption complaints should be visible only to the Vigilance Cell /
  designated audit role, not the general officer dashboard used for
  streetlight/water complaints. **Not yet enforced by the current
  auth pass** (flagged as a known gap in §7) — role-scoped visibility is
  needed before this goes beyond a demo.

## 5. Data security

- Officer-facing mutating/sensitive endpoints require authentication
  (JWT). Citizen-facing intake (register a grievance, submit an ID-update
  request, check status) is deliberately left unauthenticated — requiring
  a login from a villager speaking to a voice agent would defeat the
  platform's entire low-literacy, no-barrier premise. This is a documented
  tradeoff, not an oversight: the mitigation is rate-limiting + audit
  logging on lookups that could be used to enumerate citizens (e.g. Aadhaar
  lookup), not blanket auth.
- Every Aadhaar lookup is rate-limited and written to the audit log
  (actor, timestamp, found/not-found — never another citizen's data).
- Uploaded documents (ID photos, evidence photos) are served only through
  an authenticated/authorized route, never a public static file path.
- All core functions run on the panchayat office LAN with zero internet
  dependency by design — data does not leave the building unless a request
  is explicitly cloud-escalated (low classifier confidence) or opportunistically
  synced (Firebase bridge / gov cloud), both of which are logged.

## 6. Known gaps — stated honestly, not hidden

Being transparent about what's *not* solved is itself a governance
requirement. As of this pass:

- **Aadhaar is stored in plaintext in Postgres** (`Citizen.aadhaar`, Node/
  Prisma schema) with only a unique index, no column-level encryption or
  hashing. This should become a hashed-lookup + encrypted-at-rest column
  before any real deployment; it was not re-architected in this pass because
  it requires a coordinated migration across the citizen-facing lookup flow.
  Flagging it here so it isn't lost.
- **Firestore security rules are not yet written** for `gram_seva_requests`
  / `gram_seva_responses` / `gram_seva_live` — right now, whatever the
  Firebase project's default rules are is what's in effect. Before any
  client other than a trusted internal one talks to these collections,
  rules must restrict a citizen client to reading/writing only its own
  request/response documents.
- **Corruption-complaint visibility scoping** (§4) is not yet enforced —
  today any authenticated officer can see any grievance, including
  corruption complaints against colleagues.
- This document is an engineering/product-level policy, not a legal
  Data Protection Impact Assessment. Before real citizen data is processed
  outside a hackathon demo, it needs review against India's DPDP Act 2023
  and UIDAI's Aadhaar (Data Security) regulations by someone qualified to
  give that sign-off — this repo does not substitute for that review.

## 7. Accessibility & equity

- Every voice-first flow has a non-voice fallback (typed form) — literacy
  or a noisy environment must never block access to a service.
- Language support is intentionally treated as an extensible set
  (`shared/enums.py: Language`), not hardcoded to one — matching the
  citizen-facing app's English/Hindi/Punjabi/Marathi/Tamil chip set today,
  extensible as more are added.
- No complaint is deprioritized for being informally worded, misspelled
  (in the form path), or in a non-dominant local dialect the STT model
  transcribes imperfectly — `priority` is set by category/urgency keywords,
  never by transcript "quality."

## 8. Audit trail

Every AI routing decision is logged structuredly (`orchestrator/logging_config.py`)
with intent, confidence, and whether it was handled locally or cloud-escalated.
Every citizen-record mutation on the Node side should go through `AuditLog`.
Treat "was this AI-assisted or officer-direct" as a field worth preserving
on any record a citizen might later dispute — it's what makes a wrong
decision correctable instead of just wrong.
