<div align="center">

# 🏛️ Gram Seva AI

### Voice-first, offline-first AI for India's Gram Panchayats

**Built at the Snapdragon Multiverse Hackathon** · Qualcomm, Bengaluru · Jul 11–12, 2026

*In collaboration with Qualcomm Snapdragon, Sarvam AI, and OnePlus*

[![Watch the Demo](https://img.shields.io/badge/▶-Watch%20the%20Demo-red?style=for-the-badge)](https://youtu.be/oFbAL97vr0U)
[![Open Source](https://img.shields.io/badge/license-Open%20Source-brightgreen)](#license)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)

**Team GramSeva AI** — Powered by **Qualcomm's Hardwares and XDT Lab's team**

</div>

---

## The Problem

Village government offices (Gram Panchayats) serve millions of citizens who often can't read, don't have reliable internet, and don't have time to fill out forms. Grievances go unheard. Scheme information stays out of reach. And every digital-governance tool built for a data centre breaks the moment the network does.

## The Idea

**Gram Seva AI puts the entire office in a citizen's voice.**

A villager speaks — in their own language, over WhatsApp or a shared kiosk — and the system files a grievance, checks a scheme's eligibility, or requests an ID update. No app literacy required. No internet required. Everything runs **on-prem, offline, on-device**, powered by **Gemma 4B** running locally, with our in-house orchestration engine — **AetherRoute** — deciding what happens next.

This isn't a hackathon toy — it's designed as a real deployment path for India's **Digital Governance (DigiGov)** initiatives, built on Qualcomm Snapdragon compute from day one.

---

<div align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.19%E2%80%AFPM.png?alt=media&token=743f4a4f-7db0-4e26-9892-72f9dfad35ca" width="150"/>
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.24%E2%80%AFPM.png?alt=media&token=243538a9-2bcd-46b7-9cfb-cb7ff04e4453" width="150"/>
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.24%E2%80%AFPM.png?alt=media&token=243538a9-2bcd-46b7-9cfb-cb7ff04e4453" width="150"/>
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.29%E2%80%AFPM.png?alt=media&token=83b63a3f-51a5-4e64-b7ac-670d56879be6" width="150"/>
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.41%E2%80%AFPM.png?alt=media&token=cd656923-8d17-4650-ae2a-a3ffb46142ec" width="150"/>
  <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/Screenshot%202026-07-12%20at%201.30.47%E2%80%AFPM.png?alt=media&token=ef499ea4-24cc-43a2-9592-023d0c6d6f3c" width="150"/>
</div>

<div align="center">
            <img src="https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/WhatsApp%20Image%202026-07-12%20at%2013.40.43.jpeg?alt=media&token=2c0b31ec-5783-40aa-861b-543cf352255b" width="900"/>
</div>

## How It Works

```
Citizen speaks (WhatsApp / App / Kiosk / Website)
            │
            ▼
   n8n automation layer  ──► WhatsApp-native intake, zero app install needed
            │
            ▼
   AetherRoute Orchestrator (Snapdragon X Elite AI PC)
   ├─ Whisper STT (offline)         → converts speech to text, on-device
   ├─ Gemma 4B (on-prem)            → intent classification, no cloud call
   ├─ Vision OCR                    → reads ID documents, masks PII before it's ever saved
   └─ Local Postgres                → system of record, works with zero internet
            │
            ▼
   Grievance Platform / Scheme Chatbot / ID-Request Intake
            │
            ▼
   Arduino UNO Q (sensing layer) ──► cross-checks water/streetlight complaints against real sensor state
            │
            ▼
   Qualcomm AI Cloud 100 (optional) ──► escalation & sync when connectivity exists — never required
```

**The core design principle:** every essential function works with the network cable pulled out. The cloud is an upgrade, never a dependency.

## Component Utilisation

How each piece of hardware was actually put to work during the hackathon build — not just present in the architecture, but carrying a specific, non-overlapping responsibility.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     SNAPDRAGON X ELITE — AI PC (Copilot+)                  │
│                                                                             │
│   Role: The entire on-prem brain of the platform. Every "AI" and          │
│   "backend" need in Gram Seva AI is satisfied right here — nothing        │
│   leaves this machine unless the optional cloud tier is invoked.          │
│                                                                             │
│   ├─ Gemma 4B ............... on-device LLM, zero cloud calls             │
│   ├─ Whisper STT ............ offline speech-to-text                     │
│   ├─ Vision OCR ............. ID document reading + PII masking          │
│   ├─ AetherRoute ............ orchestration, routing, validation          │
│   ├─ FastAPI Orchestrator ... voice / grievance / ID-request APIs        │
│   ├─ Node/Express Backend ... citizens, schemes, eligibility, docs        │
│   └─ Postgres (local) ....... single system of record for everything     │
└───────────────────────────────────────────┬───────────────────────────────┘
                                             │
                    served over local network / localhost
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              ▼                                                             ▼
┌──────────────────────────────────┐                    ┌──────────────────────────────────┐
│      ONEPLUS 15 — MOBILE APP      │                    │      ARDUINO UNO Q — SENSOR NODE  │
│                                    │                    │                                    │
│  Role: The end-user's only        │                    │  Role: Deployed on-site at the    │
│  touchpoint. Owns everything a    │                    │  Qualcomm venue specifically to   │
│  citizen or field agent sees      │                    │  mitigate real network             │
│  and does.                        │                    │  restrictions inside the building │
│                                    │                    │  — a physical, local-only signal   │
│  ├─ Voice capture (mic)           │                    │  path that never depends on Wi-Fi  │
│  ├─ Grievance filing UI           │                    │  or venue connectivity.             │
│  ├─ Status tracking               │                    │                                    │
│  ├─ Profile / ID-request forms    │                    │     │
│                                    │                    │                                    │
│  ✅ Built, packaged, and           │                    │  Talks only to the AI PC over the  │
│     published for internal        │                    │  Device Abstraction Layer (DAL) —  │
│     testing — confirmed working   │                    │  no direct network path needed for │
│     end-to-end.                   │                    │  sensor cross-checks to work.      │
│                                    │                    │                                   │
│  📦 Full app source included in   │                    │                                    │
│     this repo (`Frontend/`).      │                    │                                    │
└──────────────────────────────────┘                    └──────────────────────────────────┘
```

**Why this split matters:**

- **The AI PC is the single point of intelligence** — every model call, every backend write, every source-of-truth read happens here. This is deliberate: it's what lets the entire platform work with zero internet, and it's the one node that needs to be Snapdragon-class compute.
- **The mobile app is intentionally "dumb" by design** — it captures input and displays state, but does no inference and holds no data of record. It was built, packaged, and pushed through internal testing successfully, and the complete app source is included in this repo (`Frontend/`) for review.
- **The Arduino UNO Q exists to solve one specific, local problem** — the Qualcomm venue's own network restrictions meant the sensing layer couldn't rely on venue Wi-Fi for water/streetlight state. Running it as a locally-wired node sidesteps that constraint entirely and keeps the sensor cross-check working regardless of what the building's network is doing.

- ## Technical Implementation

Everything below was designed, built, integrated, and demoed within the **24-hour window** of the Snapdragon Multiverse Hackathon — not stitched together from pre-existing templates, but engineered from scratch by the team, end to end.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         0 HR ──────────────────────────► 24 HR            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ⚡ ORCHESTRATION ENGINE           →  AetherRoute built from scratch     │
│  🧠 ON-PREM VOICE ASSISTANT        →  Whisper + Gemma 4B, fully offline  │
│  🖥️ BACKEND SYSTEMS (x2)           →  FastAPI + Node/Express, live DB    │
│  📱 MOBILE APPLICATION             →  Built, tested, deployed            │
│  💬 WHATSAPP AUTOMATION            →  n8n voice-to-action pipeline       │
│  🔌 HARDWARE INTEGRATION           →  Arduino UNO Q sensing layer        │
│  🔒 SECURITY HARDENING             →  PII masking, injection defense     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### ⚡ Building an Orchestrator From Scratch — AetherRoute

Rather than wiring a single hardcoded call to a single model, the team built **AetherRoute** — a full multi-provider LLM orchestration engine with cost governance, semantic caching, Pydantic-enforced output validation with automatic repair loops, regex-based prompt-injection defense, and hot-failover between providers. This is the piece of technical depth that lets the rest of the platform run confidently on-prem: every voice-to-intent call, every scheme-chatbot answer, and every structured extraction in Gram Seva AI passes through it.

### 🧠 Standing Up an On-Prem Voice Assistant

Speech capture, transcription, and intent understanding were built to run **entirely offline** on the Snapdragon X Elite — Whisper for speech-to-text, Gemma 4B for local intent classification, with zero round-trips to any cloud API. This was a deliberate constraint from hour one, not a fallback bolted on later: the team designed the pipeline so full functionality never depends on the venue's — or a village's — internet connection.

### 🖥️ Two Independent Backends, Cleanly Bridged

Instead of one monolithic service, the team split ownership across a **Python/FastAPI orchestrator** (voice, grievances, ID requests, sensor cross-checks) and a **Node/Express + Prisma backend** (citizens, schemes, eligibility, documents) — sharing one Postgres instance with strict table ownership, and bridged live through Firebase Firestore for cross-device status. Designing and shipping that contract inside 24 hours, rather than defaulting to a single simpler service, was a deliberate architecture call to keep each domain's logic isolated and independently testable.

### 💬 WhatsApp-Native Automation, Not Just an App

To make the platform usable by citizens with zero app literacy, the team built a **full n8n automation layer** connecting WhatsApp directly to the orchestrator — so a villager can file a grievance or ask about a scheme by simply sending a voice note to a WhatsApp number, with no app install required at all.

### 📱 A Mobile App Built, Tested, and Actually Deployed

Beyond the backend, the team designed and built a complete **FlutterFlow mobile application** — onboarding, profile, grievance tracking, and a dedicated voice-interaction screen — and took it all the way through **internal testing on real devices**, confirming the full flow works end-to-end. The complete app source is included in this repo (`Frontend/`) for review, not just a demo build.

### 🔌 Real Hardware, Not a Simulated Excuse

An **Arduino UNO Q** was wired up and integrated as a genuine sensing layer for water/streetlight status — deployed specifically to work around the hackathon venue's own network restrictions, cross-checked against citizen complaints through a clean Device Abstraction Layer (`dal.read()` / `dal.write()`), so swapping in a production board later requires touching exactly one file.

### 🔒 Security and Privacy Were Not an Afterthought

PII masking (Aadhaar/PAN numbers reduced to their last 4 digits) is enforced **inside the vision pipeline itself**, before anything is ever persisted or logged — and the scheme chatbot's topic gate runs as a **code-level check before any model call**, not as a hopeful line in a system prompt. Both are backed by automated tests, built within the same 24 hours.

---

**The headline:** in a single hackathon day, the team shipped a working orchestration engine, an offline voice pipeline, two coordinated backends, a WhatsApp automation layer, a tested and deployed mobile app, and real hardware integration — with security and privacy engineered in from the start, not patched on afterward.

---
## The Business Model

![Gram Seva AI](https://firebasestorage.googleapis.com/v0/b/kaniyur-start-rgl5rk.firebasestorage.app/o/WhatsApp%20Image%202026-07-07%20at%2012.25.01.jpeg?alt=media&token=e240ba7e-d7f8-46ef-979a-cb0ea2a486c5)


## What It Actually Does

| Capability | How it works |
|---|---|
| 🗣️ **Voice grievance filing** | Citizen describes a problem in natural speech; the system classifies intent, files the grievance, and routes it to the right department — all offline. |
| 📡 **Sensor-verified complaints** | Water and streetlight complaints are cross-checked live against real sensor data (Arduino UNO Q), so a complaint can be marked *verified* or *disputed* automatically, not left to guesswork. |
| 🪪 **ID update requests** | Citizens can request an Aadhaar / PAN / Driving Licence update. The system never touches a government database — it prepares the request and points them to the right physical facilitation office. |
| 🤖 **Scheme & policy chatbot** | Ask "What is PM-KISAN and who qualifies?" and get an answer grounded in the real scheme catalogue — not the model's guesses. A code-level topic gate rejects off-topic questions before they ever reach the model, closing the door on prompt injection. |
| 💬 **WhatsApp-native access** | An n8n automation layer means citizens never need to install an app — they simply message a WhatsApp number. |
| 🔒 **Privacy by construction** | Any Aadhaar/PAN-shaped number is masked down to its last 4 digits *inside* the vision pipeline, before it's ever written to disk or logged — enforced by automated tests, not just a policy document. |
| 📶 **Live cross-device status** | A Firebase bridge mirrors current status across the mobile app, website, and admin views every 60 seconds, so a citizen can track a complaint from any device. |

---

## Built On Snapdragon

Gram Seva AI is designed around Qualcomm's four-tier compute story:

- **Snapdragon X Elite (Copilot+ PC)** — the on-prem compute hub: local FastAPI orchestrator, Gemma 4B intent classification, offline Whisper STT, and document/ID vision-OCR.
- **OnePlus 15 / Web** — the citizen and field-agent front doors, for voice capture, grievance forms, and live status.
- **Arduino UNO Q** — the physical sensing layer for water pumps and streetlights.
- **Qualcomm AI Cloud 100** — purely optional escalation and sync, invoked only when connectivity is available.

---

## App Experience

The mobile/web client (built for the OnePlus 15 and browser) covers the full citizen journey — onboarding, profile, home feed of village announcements, grievance tracking, and a dedicated voice-command screen ("KaniyurStart") for hands-free interaction.

*(See `/screenshots` for the full onboarding → grievance → voice flow.)*

---

## The Stack, In Depth

Gram Seva AI is a **system of systems** — two application backends and one orchestration engine, each doing one job well.

### ⚡ AetherRoute — The Orchestration Core

Every voice request, grievance classification, and chatbot query in Gram Seva AI passes through **AetherRoute**, our in-house multi-provider LLM orchestration and routing engine. It's what lets the whole platform run fully on-prem against Gemma 4B while still being resilient, cost-safe, and auditable — the same qualities you'd want from a cloud LLM gateway, but running locally on a Snapdragon X Elite box with zero internet dependency.

```
                         ┌─────────────────────┐
   Request  ───────────► │   Input Sanitizer    │
                         └──────────┬───────────┘
                                    ▼
                         ┌─────────────────────┐
                         │  Cache Lookup        │ ── Exact + Semantic (Redis / in-memory)
                         └──────────┬───────────┘
                              Cache Hit │ Cache Miss
                          ◄────────────┘         │
                    (return cached response)     ▼
                                       ┌─────────────────────────┐
                                       │  Context Curation        │  Sliding window + TF-IDF
                                       │                           │  relevance + async summarization
                                       └──────────┬────────────────┘
                                                  ▼
                                       ┌─────────────────────────┐
                                       │  Scoring & Decision      │  Task fit, cost, latency,
                                       │  Router                  │  SQLite historical performance
                                       └──────────┬────────────────┘
                                                  ▼
                                       ┌─────────────────────────┐
                                       │  Provider Pool            │  Gemma 4B (on-prem) · OpenAI ·
                                       │                            │  Anthropic Claude · Mistral · Ollama
                                       └───┬──────────────────┬────┘
                                      Success│              │Failure
                                            ▼                ▼
                              ┌──────────────────────┐   ┌────────────────────┐
                              │ Pydantic Validator    │   │ Hot Failover        │
                              │ (up to 3 repair       │   │ → next-best         │
                              │  re-prompt retries)    │   │   provider           │
                              └──────────┬────────────┘   └──────────┬─────────┘
                                        ▼                            │
                              ┌──────────────────────┐               │
                              │ SQLite Logging         │◄─────────────┘
                              │ (cost, latency, trace) │
                              └──────────┬────────────┘
                                        ▼
                                   Final Response
```

**Why Gram Seva AI needed to build this rather than call a model directly:**

| AetherRoute Feature | What it gives Gram Seva AI |
|---|---|
| **Resilient Failover & Registry** | If the on-prem Gemma 4B instance is ever degraded, the orchestrator can hot-fail to a backup provider without a citizen's request ever failing outright. |
| **Prompt Normalization** | One unified prompt format across every model backend the platform might use — no rewriting intent-classification prompts per provider. |
| **Real-Time Cost Governor** | Hard per-request and per-session cost ceilings, so any future cloud-escalation path (Qualcomm AI Cloud 100) can never runaway-bill a village office. |
| **Sliding Context Curation** | TF-IDF relevance pruning keeps long grievance/chat conversations inside the token window without losing older, relevant complaint context. |
| **Output Validation & Repair Loops** | Every intent classification and structured extraction (grievance category, urgency, ID-update type) is Pydantic-validated, with automatic repair re-prompts — no malformed JSON ever reaches the database. |
| **Security Input Sanitization** | Regex-based injection detection and RBAC guards are the first thing a citizen's transcript hits — this is what makes the scheme chatbot's topic gate hold even against adversarial prompts. |
| **Fuzzy Semantic Cache** | Common questions ("What is PM-KISAN?", asked in a dozen phrasings across a village) get served from cache instead of re-running inference every time. |
| **CLI Observability Report** | Every routing decision, cost, and retry across the whole platform is queryable via `aetherroute-report` — critical for debugging a system meant to run unsupervised in a panchayat office. |

### 🐍 Python Orchestrator Layer

`orchestrator/`, `grievance/`, `id_services/`, `dal/` — owns voice intake, intent classification (via AetherRoute + Gemma 4B), grievances, Arduino sensor cross-checks, and Aadhaar/PAN/Driving-Licence update requests. This is the low-latency path the app talks to directly for anything voice- or model-driven.

### 🟩 Node/Express Backend

`Gram_Seva_Ai/backend/` — owns citizens, schemes, eligibility, applications, and documents via Prisma/Postgres, and bridges everything to Firebase Firestore for real-time cross-device status.

Both backends share a single physical Postgres instance with clearly separated table ownership — not two competing sources of truth. Full contract in [`shared/CONTRACT.md`](./shared/CONTRACT.md), Firestore bridge shape in [`react_firebase_integration.md`](./react_firebase_integration.md).

---

## Repo Layout

```
orchestrator/       FastAPI app — intent classification (via AetherRoute), voice (Whisper), routing
aetherroute/         Multi-provider LLM orchestration engine — caching, cost control, validation, failover
dal/                 Device Abstraction Layer — dal.read()/dal.write(), simulated Arduino backend
grievance/           Grievance Platform — filing, sensor cross-check, department routing
id_services/         Aadhaar/PAN/DL update request intake (never writes to a gov system)
shared/              API contract, data-governance policy, DB schema, Pydantic models
infra/               docker-compose (local Postgres), Arduino wiring notes
tests/               Offline unit tests — no DB/network required
website/             Glassmorphic React web client (Vite)
Frontend/            FlutterFlow mobile app (OnePlus 15 client)
Gram_Seva_Ai/        Node/Express/Prisma backend — citizens, schemes, Firebase bridge
```

---

## Quick Start

**1. Start Postgres**
```bash
cd infra
docker compose up -d
```
Applies the schema automatically (`gramseva` / `gramseva` / `gramseva`). Point the Node backend at the same instance:
```bash
cd Gram_Seva_Ai/backend && npx prisma migrate deploy
```

**2. Install Python dependencies**
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```
This installs **AetherRoute** alongside the rest of the orchestrator's dependencies.

**3. Configure environment**
```bash
cp .env.example .env
```
Runs out of the box with offline mock classifier/STT/vision — no model weights needed for a quick demo. Point `LLM_BACKEND` / `STT_BACKEND` / `VISION_BACKEND` at your local Gemma 4B / Whisper / OCR models when ready. AetherRoute itself runs in mock mode with zero API keys set — set `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `MISTRAL_API_KEY` only if you want a live cloud-escalation fallback provider.

**4. Run the orchestrator**
```bash
uvicorn orchestrator.main:app --reload --port 8000
```
API docs live at `http://localhost:8000/docs`.

**5. (Optional) Run the Node backend + website**
```bash
cd Gram_Seva_Ai/backend && npm install && cp .env.example .env && npm run dev   # :3000
cd website && npm install && cp .env.example .env.local && npm run dev          # :5173
```

> For the full, dependency-checked, "what's actually verified working" walkthrough, see **[`RUNBOOK.md`](./RUNBOOK.md)** — it's kept more current than any other doc in this repo.

---

## Try It

**File a voice grievance:**
```bash
curl -X POST http://localhost:8000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "The streetlight near the temple has not worked for a week",
    "language": "en",
    "channel": "voice",
    "citizen_id": "+919900011122"
  }'
```

**Ask the scheme chatbot (routed through AetherRoute):**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is PM-KISAN and who is eligible?"}'
```
Try an off-topic question ("write me a poem") and watch `on_topic: false` come back — rejected by AetherRoute's security layer before it ever reaches a model.

**Flip a simulated sensor and re-check a grievance:**
```bash
python -c "
from dal.factory import get_dal
get_dal().write('arduino_uno_q', 'streetlight_status', {'on': False})
"
```

**Inspect AetherRoute's own routing decisions, cost, and latency:**
```bash
aetherroute-report --db aetherroute.db --traces 25
```

Run the offline test suite:
```bash
pytest
```

---

## Design Principles

- **Local-first, cloud-optional** — cloud escalation and sync are non-blocking stubs by design; the local write path never waits on the network.
- **One contract to the sensing layer** — orchestrator and grievance code only ever call `dal.read()` / `dal.write()`; swapping the simulated Arduino for a real board means adding one backend, nothing else changes.
- **One contract to the model layer** — every model call, whether it's intent classification or the scheme chatbot, goes through AetherRoute; swapping Gemma 4B for another backend, or adding a cloud fallback, never touches application code.
- **Privacy enforced in code, not policy** — PII masking happens inside the vision client itself, before anything is persisted or logged, and is covered by automated tests.
- **The model never freelances** — the scheme chatbot's topic gate is a code-level check that runs *before* any model call, and every answer is grounded in the real scheme database.
- **ID requests stay in their lane** — the system prepares and routes a request; it never writes to UIDAI, NSDL, or Parivahan directly. Citizens are pointed to the correct facilitation office every time.
- **Nothing is a black box** — both the platform's grievance routing and AetherRoute's model routing decisions are logged and queryable, not hidden inside a single opaque call.

Full data-governance rationale in [`shared/DATA_GOVERNANCE.md`](./shared/DATA_GOVERNANCE.md).

---

## License

Gram Seva AI, including the AetherRoute orchestration engine, is released as **open source**. See the `LICENSE` file in this repository for the exact terms.

---

## The Team

**XDOSO Tech Labs LLP**

| Name | Role |
|---|---|
| **Dhevadharshan Srinivasan** | CEO, XDOSO Tech Labs LLP · Director, Veritas Fine Sinter · 4th Year B.E. ECE, KPRIET, Coimbatore |
| **Mithun Barath Mayilsamy** | CISO, XDOSO Tech Labs LLP |
| **Tamilselvan Narayanan** | App Development Lead, XDOSO Tech Labs LLP · Final Year B.E. ECE, KPRIET, Coimbatore |
| **Varshini Srinivasan** | Final Year B.E. ECE, KPRIET, Coimbatore |
| **Rajeswaran Dinakaran** | 3rd Year B.E. CSE, KPRIET, Coimbatore |

📧 dhevreads@gmail.com &nbsp;·&nbsp; 🌐 [www.dhev.online](http://www.dhev.online) &nbsp;·&nbsp; ▶️ [Demo Video](https://youtu.be/oFbAL97vr0U)

---

<div align="center">

*Gram Seva AI — bringing every village office online, without needing the internet.*

</div>
