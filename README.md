# Gram Seva AI

Offline-first, voice-driven platform for Indian village government offices
(gram panchayats). Built for the Snapdragon Multiverse Hackathon (Qualcomm
Bengaluru, Jul 11–12 2026).

Runs across four device tiers:

1. **Snapdragon X Elite AI PC (Copilot+)** — compute hub: this repo's
   Python orchestrator. Local FastAPI server, Gemma4-based intent
   classification, offline Whisper STT, a document/ID vision-OCR model,
   local Postgres as system of record.
2. **OnePlus 15 mobile / the website** — citizen/field-agent interfaces
   (voice capture, forms, status checks). Talk to the orchestrator's API
   directly for voice/grievance/ID-request flows, and to Firebase for
   cross-device live status (see Architecture below).
3. **Arduino UNO Q** — sensing layer (water pump / streetlight state).
   Simulated here behind the same interface a real board will use.
4. **Qualcomm AI Cloud 100** — optional escalation + opportunistic sync.
   Never a hard dependency; every core function works with zero internet.

See [`shared/CONTRACT.md`](shared/CONTRACT.md) for the orchestrator's API
contract, and [`shared/DATA_GOVERNANCE.md`](shared/DATA_GOVERNANCE.md) for
the Responsible AI / data-security posture — read that one before treating
this as more than a hackathon demo.

## Architecture — two backends, one bridge

This repo grew two backends during the hackathon, each owning a different
domain, joined by Firebase:

- **Python orchestrator** (`orchestrator/`, `grievance/`, `id_services/`,
  `dal/`) — owns voice intake, intent classification, grievances, Arduino
  sensor cross-checks, and Aadhaar/PAN/Driving-Licence update *requests*.
  This is what the website's voice/grievance/ID-request flows call
  directly (needs low-latency access to the local models).
- **Node/Express backend** (`Gram_Seva_Ai/backend/`) — owns citizens,
  schemes, eligibility, applications, and documents (Prisma/Postgres).
  Bridges to Firebase Firestore: clients write to `gram_seva_requests`,
  a listener processes them into Postgres and writes `gram_seva_responses`;
  a 60-second job mirrors current Postgres state (citizens, applications,
  **and** the Python side's grievances) into `gram_seva_live` for
  cross-device read views. See `Gram_Seva_Ai/backend/SECURITY_CHANGES.md`
  for what auth/security hardening was applied to it.
- **`react_firebase_integration.md`** (repo root) is the source-of-truth
  spec for the Firestore bridge shape — both the website and any other
  client should follow it exactly.

Both backends share the **same physical Postgres instance**, different
tables (see table-ownership note in `shared/CONTRACT.md` §5) — not two
independent databases.

## Repo layout

```
orchestrator/     FastAPI app: intent classification, voice (Whisper), routing
dal/               Device Abstraction Layer — dal.read()/dal.write(), simulated Arduino backend
grievance/         Grievance Platform: POST/GET /grievances, sensor cross-check, dept routing
id_services/       Aadhaar/PAN/DL update REQUEST intake — never writes to a gov system directly
shared/            Contract + data-governance docs, Pydantic schemas/enums, Postgres schema, DB engine
infra/             docker-compose (local Postgres), Arduino wiring notes
tests/             Offline unit tests (classifier, DAL, ID masking — no DB/network required)
website/           Glassmorphic React web client (Vite) — see website/README.md
Frontend/          FlutterFlow mobile app (OnePlus 15 citizen/field-agent client)
Gram_Seva_Ai/      Node/Express/Prisma backend — citizens, schemes, eligibility, Firebase bridge
react_firebase_integration.md   Firestore bridge contract (requests/responses/live collections)
```

## Setup (under 5 minutes for the orchestrator; longer if you also stand up the Node backend + website)

### 1. Start Postgres

```bash
cd infra
docker compose up -d
```

This starts Postgres on `localhost:5432` and applies
[`shared/schema.sql`](shared/schema.sql) automatically on first boot
(user `gramseva` / password `gramseva` / db `gramseva`). The Node backend
uses the **same instance** — apply its Prisma migrations against it too
(`cd Gram_Seva_Ai/backend && npx prisma migrate deploy`).

No Docker on hand? Point `DATABASE_URL` at any local Postgres 14+ instance
and apply the schema yourself: `psql -d gramseva -f shared/schema.sql`.

### 2. Install Python dependencies

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Defaults work out of the box against the docker-compose Postgres and the
offline mock classifier/stub STT/stub vision backends — **no model weights
required to run the demo.** See `.env.example` for how to point
`LLM_BACKEND`, `STT_BACKEND`, and `VISION_BACKEND` at your real local
Gemma4/Whisper/vision-OCR models, and the intranet-IP note at the top of
that file if models or Postgres run on a different LAN machine.

### 4. Run the orchestrator

```bash
uvicorn orchestrator.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs`.

### 5. (Optional) Run the Node backend + website

```bash
cd Gram_Seva_Ai/backend && npm install && cp .env.example .env && npm run dev   # port 3000
cd website && npm install && cp .env.example .env.local && npm run dev          # port 5173
```

Both need Node.js installed — **not verified/built in this environment**
(no Node.js available here); install dependencies and confirm they build
before a live demo.

## Try it (zero network required beyond localhost)

**Submit a grievance via the orchestrator** (voice-pipeline shape, per
`shared/CONTRACT.md` §1):

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

Returns the routing decision plus the created grievance's id
(`downstream.resource_id`). Watch the server's stdout — every request logs
a `routing_decision` JSON line showing `intent`, `confidence`, and whether
it was handled `local`ly or `cloud_escalated`.

**Check status:**

```bash
curl http://localhost:8000/grievances/<id-from-above>
```

For a streetlight/water grievance, the response includes `sensor_check`
showing the live DAL reading and whether it came back `verified` or
`disputed` against the (simulated) Arduino state.

**Flip the sensor and resubmit** to see the verdict change:

```bash
python -c "
from dal.factory import get_dal
get_dal().write('arduino_uno_q', 'streetlight_status', {'on': False})
"
```

**Try an ID-update request** (never writes to a real government system —
see `shared/DATA_GOVERNANCE.md` §1):

```bash
curl -X POST http://localhost:8000/id-requests \
  -H "Content-Type: application/json" \
  -d '{
    "citizen_id": "+919900011122",
    "id_type": "aadhaar",
    "update_type": "address_change",
    "description": "We moved from Rampur to Ward 4, need address updated",
    "source_channel": "form"
  }'
```

The response includes `authority_office` — the physical facilitation
centre the citizen still has to visit.

**Or submit straight to the Grievance Platform** (bypassing the
orchestrator, e.g. for offline form entry):

```bash
curl -X POST http://localhost:8000/grievances \
  -H "Content-Type: application/json" \
  -d '{
    "citizen_id": "+919900011122",
    "category": "water",
    "description": "No water from the tap since morning",
    "location": "Ward 4",
    "priority": "medium",
    "source_channel": "form"
  }'
```

## Running tests

```bash
pytest
```

Covers the mock classifier, DAL/simulated backend, and the ID-document
PII-masking guardrail — no DB or network required. (Full grievance/ID
flows are exercised via the curl examples above against the running
server + Postgres.)

## Design notes for the team

- **Extensible intent enum** — `Intent` (`shared/enums.py`) now has 6
  values (added `id_update_request`); add more without breaking existing
  consumers (unknown intents should be logged, not hard-failed).
- **DAL is the only device contract** — orchestrator and grievance code
  never call a device driver directly, only `dal.read()`/`dal.write()`.
  Swapping the simulated Arduino backend for the real board means adding
  one new `DeviceBackend` in `dal/`, per
  [`infra/arduino/README.md`](infra/arduino/README.md).
- **Local-first, cloud-optional** — `cloud_escalate()`
  (`orchestrator/routing.py`) and `sync_to_gov_cloud()`
  (`grievance/sync.py`) are both stubs, non-blocking with respect to the
  local write path by design.
- **ID update requests never touch a government system** — `id_services/`
  prepares a request and names a facilitation office; it does not and
  cannot submit to UIDAI/NSDL/Parivahan. See `shared/DATA_GOVERNANCE.md` §1.
- **PII masking is enforced, not just documented** — `orchestrator/vision.py`
  masks any Aadhaar/PAN-shaped value to its last 4 characters before it's
  ever persisted; see `tests/test_id_services.py` for the enforcement tests.
- **Table ownership** — `grievances`, `device_state`, and
  `id_update_requests` are owned by this repo's Python side; citizens/
  schemes/applications/documents are owned by `Gram_Seva_Ai/backend`'s
  Prisma schema. `farmer_produce` is reserved but undefined — coordinate
  before adding it.

## License

MIT — see [`LICENSE`](LICENSE).
