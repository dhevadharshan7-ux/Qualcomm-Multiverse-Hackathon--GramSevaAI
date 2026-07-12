<div align="center">

# 🏛️ Gram Seva AI

### Voice-first, offline-first AI for India's Gram Panchayats

**Built at the Snapdragon Multiverse Hackathon** · Qualcomm, Bengaluru · Jul 11–12, 2026

*In collaboration with Qualcomm Snapdragon, Sarvam AI, and OnePlus*

[![Watch the Demo](https://img.shields.io/badge/▶-Watch%20the%20Demo-red?style=for-the-badge)](https://youtu.be/oFbAL97vr0U)

**Team GramSeva AI** — presented by **XDOSO Tech Labs LLP**

</div>

---

## The Problem

Village government offices (Gram Panchayats) serve millions of citizens who often can't read, don't have reliable internet, and don't have time to fill out forms. Grievances go unheard. Scheme information stays out of reach. And every digital-governance tool built for a data centre breaks the moment the network does.

## The Idea

**Gram Seva AI puts the entire office in a citizen's voice.**

A villager speaks — in their own language, over WhatsApp or a shared kiosk — and the system files a grievance, checks a scheme's eligibility, or requests an ID update. No app literacy required. No internet required. Everything runs **on-prem, offline, on-device**, powered by **Gemma 4B** running locally, with an in-house orchestration engine we call **AetherRoute** deciding what happens next.

This isn't a hackathon toy — it's designed as a real deployment path for India's **Digital Governance (DigiGov)** initiatives, built on Qualcomm Snapdragon compute from day one.

---

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

---

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

## Architecture: Two Backends, One Bridge

The system deliberately splits into two services, each owning what it's best at, joined by Firebase:

- **Python Orchestrator** (`orchestrator/`, `grievance/`, `id_services/`, `dal/`) — owns voice intake, intent classification, grievances, Arduino sensor cross-checks, and ID-update requests. This is the low-latency path the app talks to directly for anything voice- or model-driven.
- **Node/Express Backend** (`Gram_Seva_Ai/backend/`) — owns citizens, schemes, eligibility, applications, and documents via Prisma/Postgres, and bridges everything to Firebase Firestore for real-time cross-device status.

Both share a single physical Postgres instance with clearly separated table ownership — not two competing sources of truth. Full contract in [`shared/CONTRACT.md`](./shared/CONTRACT.md), Firestore bridge shape in [`react_firebase_integration.md`](./react_firebase_integration.md).

---

## Repo Layout

```
orchestrator/     FastAPI app — intent classification, voice (Whisper), routing
dal/               Device Abstraction Layer — dal.read()/dal.write(), simulated Arduino backend
grievance/         Grievance Platform — filing, sensor cross-check, department routing
id_services/       Aadhaar/PAN/DL update request intake (never writes to a gov system)
shared/            API contract, data-governance policy, DB schema, Pydantic models
infra/             docker-compose (local Postgres), Arduino wiring notes
tests/             Offline unit tests — no DB/network required
website/           Glassmorphic React web client (Vite)
Frontend/          FlutterFlow mobile app (OnePlus 15 client)
Gram_Seva_Ai/      Node/Express/Prisma backend — citizens, schemes, Firebase bridge
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

**3. Configure environment**
```bash
cp .env.example .env
```
Runs out of the box with offline mock classifier/STT/vision — no model weights needed for a quick demo. Point `LLM_BACKEND` / `STT_BACKEND` / `VISION_BACKEND` at your local Gemma 4B / Whisper / OCR models when ready.

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

**Ask the scheme chatbot:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is PM-KISAN and who is eligible?"}'
```
Try an off-topic question ("write me a poem") and watch `on_topic: false` come back — rejected before it ever reaches a model.

**Flip a simulated sensor and re-check a grievance:**
```bash
python -c "
from dal.factory import get_dal
get_dal().write('arduino_uno_q', 'streetlight_status', {'on': False})
"
```

Run the offline test suite:
```bash
pytest
```

---

## Design Principles

- **Local-first, cloud-optional** — cloud escalation and sync are non-blocking stubs by design; the local write path never waits on the network.
- **One contract to the sensing layer** — orchestrator and grievance code only ever call `dal.read()` / `dal.write()`; swapping the simulated Arduino for a real board means adding one backend, nothing else changes.
- **Privacy enforced in code, not policy** — PII masking happens inside the vision client itself, before anything is persisted or logged, and is covered by automated tests.
- **The model never freelances** — the scheme chatbot's topic gate is a code-level check that runs *before* any model call, and every answer is grounded in the real scheme database.
- **ID requests stay in their lane** — the system prepares and routes a request; it never writes to UIDAI, NSDL, or Parivahan directly. Citizens are pointed to the correct facilitation office every time.

Full rationale in [`shared/DATA_GOVERNANCE.md`](./shared/DATA_GOVERNANCE.md).

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
