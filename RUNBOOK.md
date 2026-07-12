# Gram Seva AI — Full System Runbook

Step-by-step startup for every server in the system, plus how to make
Postgres reachable from other devices on the same panchayat-office LAN
(mobile app, another dev's laptop, etc.). Written against **this specific
machine's** current state — see §0 before assuming anything is already
working.

---

## 0. What's actually true on this machine right now

Checked directly, not assumed:

| Component | Status |
|---|---|
| PostgreSQL 18 (Windows service `postgresql-x64-18`) | ✅ Installed, running, port 5432, **now LAN-accessible** (see §2) |
| `Gram_Seva_Ai` database (Node/Prisma backend) | ✅ Created, schema applied |
| `gramseva` database (Python orchestrator) | ✅ Created, schema applied, verified end-to-end |
| Ollama | ✅ Installed and running (`http://localhost:11434`) |
| A real Gemma model in Ollama | ❌ Not pulled — only one model exists (see below) |
| Voice transcription (Whisper) | ✅ **Verified working, `large-v3`.** Confirmed (not assumed) that Ollama has no audio-input mechanism at all — its own API docs only accept text and base64 images. `karanchopda333/whisper:latest` (the model this project's Ollama had pulled) is a mislabeled text LLM anyway. `faster-whisper` runs `large-v3` in-process instead (§3.3) — real TTS-generated speech ("The streetlight near the temple has not worked for a week") transcribed correctly through the actual `/orchestrate/voice` endpoint and produced a correctly-classified, persisted grievance. |
| Document/ID OCR | ✅ **Verified working** — `easyocr` (real, in-process, no external binary) reads actual text off a document photo. Tested end-to-end through `/id-requests/{id}/document`: correctly extracted a name, DOB, and masked ID number from a synthetic test ID image. Caught and fixed two real bugs along the way (a Windows console-encoding crash in EasyOCR's progress bar, and a boilerplate-text filter that failed on OCR's merged spacing) — see `orchestrator/vision.py`. |
| Scheme/policy chatbot | ✅ **New, verified working** — `POST /chat` and `POST /chat/voice`. Grounds answers in the real `Scheme` table (cross-database read from `Gram_Seva_Ai`), refuses off-topic questions before ever calling a model. Tested live through the actual website UI (see §6). |
| `.env` actually being loaded | ✅ **Fixed a real bug** — `python-dotenv` was a listed dependency but `load_dotenv()` was never called anywhere in the code, so every `.env` value was silently ignored in favor of hardcoded defaults. Now called at the very top of `orchestrator/main.py`, before any module that reads env vars at import time. **Restart the orchestrator process if it's already running for this to take effect.** |
| Node.js / npm | ✅ Installed and running — website confirmed working, live-tested through the browser this session |
| Python venv (`.venv`) | ✅ Set up, dependencies installed (`faster-whisper`, `easyocr` added this session) |
| "Genie CLI" for Gemma | ❌ Still not found anywhere on this machine. `LLM_BACKEND=mock` remains the default; tell me how Genie is actually invoked and I'll wire a proper backend. |
| Website UI theme | ✅ Redesigned — light grey/white glassmorphism, no dark mode, verified via computed styles in a live browser session (`--bg-base: #f4f5f7`, glass panels `rgba(255,255,255,0.92)`). Left sidebar (Home/ID Help/Profile/Grievances) replaces the old bottom tab bar. |
| Firebase bridge (teammate's version) | ⚠️ **Restructured since last checked** — `Gram_Seva_Ai (3)/.../src/firebase/` now has `publish/`, `request/`, `scheduler/`, `sync/`, `verify/` subdirectories that didn't exist in the copy I last reviewed. Investigating for WhatsApp/n8n wiring — findings below once complete. |

Machine's LAN IP (Wi-Fi): **`10.91.53.228`** — this is what other devices on
the network use to reach everything below. It's on subnet `10.91.48.0/20`.

---

## 1. Start order (quick reference)

1. PostgreSQL — already running as a Windows service, starts automatically on boot. Nothing to do unless it's stopped (§2.1).
2. Ollama — `ollama serve` (if not already running as a background app).
3. Python orchestrator — `uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000` (the `--host 0.0.0.0` matters — see §4).
4. Node backend — `npm run dev` in `Gram_Seva_Ai (3)/Gram_Seva_Ai/backend` (port 3000) — **needs Node.js installed first**.
5. Website — `npm run dev` in `website/` (port 5173) — **needs Node.js installed first**.

---

## 2. PostgreSQL

### 2.1 Start/stop/check (local)

It runs as a Windows service and starts automatically on boot. To check or
control it manually:

```powershell
Get-Service postgresql-x64-18          # check status
Start-Service postgresql-x64-18        # start (needs an elevated/admin shell)
Stop-Service postgresql-x64-18         # stop
```

If you don't have an elevated shell, use `pg_ctl` directly instead (works
from a normal shell since it talks to the data directory, not the Service
Control Manager):

```bash
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" status -D "C:\Program Files\PostgreSQL\18\data"
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start  -D "C:\Program Files\PostgreSQL\18\data" -w
```

### 2.2 Remote/LAN access — already configured

This was set up so **any device on the same network** (`10.91.48.0/20`) can
connect directly, not just this machine:

- `postgresql.conf`: `listen_addresses = '*'` (binds all interfaces —
  confirmed via `netstat`: listening on `0.0.0.0:5432` and `[::]:5432`).
- `pg_hba.conf`: added `host all all 10.91.48.0/20 scram-sha-256` (password
  auth required, not trust — see the comment marking this block in the file).
- Windows Firewall: the installer's existing "PostgreSQL Server" rule
  already allows inbound TCP for `postgres.exe` on the **Public** profile
  (this machine's current network category) — verified, no new rule needed.

**From another device on the same Wi-Fi**, connect with:

```bash
psql -h 10.91.53.228 -p 5432 -U gramseva -d gramseva      # Python orchestrator's DB
psql -h 10.91.53.228 -p 5432 -U postgres -d Gram_Seva_Ai  # Node backend's DB
```

Or in any app's connection string:
```
postgresql://gramseva:gramseva@10.91.53.228:5432/gramseva
postgresql://postgres:Hackathon123@10.91.53.228:5432/Gram_Seva_Ai
```

**Security tradeoff, stated plainly:** `10.91.48.0/20` is the whole Wi-Fi
subnet — at a hackathon venue that could be thousands of other attendees'
devices, not just your team's. Password auth (`scram-sha-256`) is still
required, so this isn't an open door, but it's broader than "just my
teammates." If you want to narrow it, replace the subnet in `pg_hba.conf`
with your teammates' specific IPs (`host all all 10.91.53.x/32` per
device) and `pg_ctl reload` (no restart needed for `pg_hba.conf` changes).
Also worth doing before a real demo: change `Hackathon123` and `gramseva`
to less guessable passwords now that this is network-reachable — same
`ALTER USER ... WITH PASSWORD '...'` command, no restart needed.

### 2.3 If the service won't start / connection refused

Check the log for the actual reason rather than guessing:
```bash
# Newest log file:
ls -t "C:\Program Files\PostgreSQL\18\data\log" | head -1
cat "C:\Program Files\PostgreSQL\18\data\log\<that file>"
```
Common cause on this machine: something else already bound to port 5432 —
`pg_ctl start` will fail with "could not bind" if so. Check with
`netstat -an | findstr 5432` before retrying.

---

## 3. AI models

All three are configured via env vars in `.env` (Python orchestrator) —
copy `.env.example` to `.env` first if you haven't. Defaults point at
`localhost`; change to `10.91.53.228` (or wherever the model server
actually runs) if it's on a different machine on the LAN.

### 3.1 Ollama — start it

```bash
ollama serve
```
(If it's already running as a background app/tray icon, as it is right now
on this machine, you don't need to run this again — check with
`curl http://localhost:11434/api/tags`.)

### 3.2 Gemma (intent classification) — not pulled yet

```bash
ollama pull gemma2:4b
```
Then in `.env`:
```
LLM_BACKEND=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:4b
```
Until this is pulled, leave `LLM_BACKEND=mock` (the offline keyword
classifier) — the orchestrator already falls back to it automatically if
the configured backend errors, so nothing breaks either way.

**If you're actually using Genie CLI instead of Ollama for this:** it
wasn't found anywhere on this machine, so these instructions can't cover
its exact invocation. `orchestrator/classifier.py`'s `OllamaGemmaClassifier`
is the only real-model backend implemented so far — tell me how Genie is
actually invoked (binary path, whether it serves HTTP or is a one-shot CLI
call) and I'll add a proper backend for it instead of guessing.

### 3.3 Whisper (voice transcription) — now working, in-process

The model previously in Ollama (`karanchopda333/whisper:latest`) **was not
a speech-to-text model** (see §0) — that path is abandoned. Instead,
`orchestrator/speech.py` now has a `faster_whisper` backend that runs
Whisper **in-process** via the `faster-whisper` library (CTranslate2) — no
separate server, no HTTP endpoint to stand up or misconfigure.

```
STT_BACKEND=faster_whisper
FASTER_WHISPER_MODEL=base            # tiny/base/small/medium/large-v3 — bigger = slower + more accurate
FASTER_WHISPER_DEVICE=cpu            # no CUDA on this box; int8 CPU inference is the realistic default
FASTER_WHISPER_COMPUTE_TYPE=int8
```

Already set in `.env` and confirmed working. First voice request after a
server (re)start is slow (a few seconds) while the model loads and gets
cached in memory — subsequent requests are fast.

**Fastest path to actual NPU acceleration later** (better fit for the
Snapdragon X Elite pitch than CPU inference): you already have
`whisper_large_v3_turbo-precompiled_qnn_onnx-float-qualcomm_snapdragon_x_elite`
in Downloads (2GB, NPU-accelerated ONNX build). Wiring that in needs a
small ONNX Runtime + QNN execution-provider serving script behind the same
`SpeechToTextClient` interface — not built yet, say the word and I will.

If you'd rather run STT as a separate server/process instead (e.g. on a
different LAN machine), `STT_BACKEND=whisper` + `WHISPER_STT_URL` still
works against any OpenAI-compatible `/v1/audio/transcriptions` server.

### 3.4 Document/ID vision-OCR

Same situation as Gemma — needs a real model pulled:
```bash
ollama pull qwen2-vl:2b
```
Then in `.env`:
```
VISION_BACKEND=ollama-vlm
VISION_MODEL=qwen2-vl:2b
```
Until pulled, leave `VISION_BACKEND=stub` (filename-based type guess only,
no field extraction — degrades safely, doesn't error).

---

## 4. Python orchestrator

```bash
cd "Gram Seva AI"
.venv\Scripts\activate
cp .env.example .env        # first time only, then edit as needed per §3
uvicorn orchestrator.main:app --reload --host 0.0.0.0 --port 8000
```
**`--host 0.0.0.0` is required for LAN access** — uvicorn binds to
`127.0.0.1` only by default, which would make it unreachable from other
devices even though Postgres and everything else is LAN-open. With it set,
docs are at `http://localhost:8000/docs` locally, or
`http://10.91.53.228:8000/docs` from another device on the LAN.

---

## 5. Node backend

**Needs Node.js installed first** (not present on this machine — get it
from nodejs.org, LTS version, then reopen your terminal so `node`/`npm`
are on `PATH`).

```bash
cd "Gram Seva AI\Gram_Seva_Ai (3)\Gram_Seva_Ai\backend"
npm install
npm run dev                 # port 3000
```
Its `.env` already points at the now-working `Gram_Seva_Ai` database on
port 5432 (fixed this session) and has real Firebase Admin credentials in
it — see the security note in the previous conversation about keeping that
file out of git (it already is, via `.gitignore`).

**Important schema mismatch, read before running `npm run prisma:migrate`:**
this `(3)` copy is the original, unmodified backend — no officer
login/auth, no Firebase sync wiring, no scheme-catalog import. Earlier
this session I applied a *different, more complete* set of migrations
(officer password field, optional scheme benefit/department + a new
schemeUrl field) directly to the live `Gram_Seva_Ai` database via raw SQL,
from work done on a since-removed copy of this backend — so **the live
database now has columns this `(3)` copy's `prisma/schema.prisma` doesn't
know about.** Running `npm run prisma:migrate` here will likely detect
that drift and prompt you (possibly toward a destructive reset — read
whatever it says carefully, don't accept a reset without checking first).

Don't run `prisma:migrate`/`prisma:seed` yet — tell me whether you want
that hardening (auth, Firebase live-sync, scheme catalog) rebuilt on top
of this `(3)` copy, and I'll bring its schema/migrations/seed back in
sync with what's actually in the database first. Until then, the backend
will run and connect fine (§0 confirms the DB works) — you'd just be
running the version without login/auth or the scheme catalog.

Dev officer login (**not available on this `(3)` copy** until the above is
resolved — the `Officer` model here has no password field yet):
`POST /api/auth/officer/login` with
`{"email": "officer1@gramseva.dev", "password": "dev-only-change-me"}`.

---

## 6. Website

**Also needs Node.js.**

```bash
cd "Gram Seva AI\website"
npm install
cp .env.example .env.local
npm run dev                 # port 5173
```
Set `VITE_ORCHESTRATOR_URL` in `.env.local` to `http://10.91.53.228:8000`
if a teammate is running the orchestrator on a different machine than the
one serving the website. Same for `VITE_FIREBASE_*` if you want the live
"My Grievances" view working — get those values from Firebase Console
(the project is `kaniyur-start-rgl5rk`, per the Node backend's `.env`).

---

## 7. Arduino UNO Q (DAL)

No separate server — the simulated backend runs in-process inside the
Python orchestrator (`dal/simulated_backend.py`). Nothing to start. To
wire in the real board later, see `infra/arduino/README.md`.

---

## 7.5. WhatsApp → n8n → Firebase → Postgres

**Checked, was not implemented — now is.** A teammate had described this
pipeline as already built; it wasn't (verified by reading every file
under `Gram_Seva_Ai (3)/.../src/firebase/`, confirmed zero references to
"n8n" anywhere in the codebase). What *did* already exist and turned out
to be genuinely wired and working: a generic Firestore request/response
bridge (`gram_seva_requests` → `actionRouter.js` → Postgres services →
`gram_seva_responses`), and a separate Postgres→Firestore live mirror
implemented as a Prisma Client Extension — better engineering than the
polling-based mirror I'd built for an earlier copy of this backend.

That existing bridge just had no action shaped for an inbound chat
message. Added one (`handleMessage`, `src/firebase/request/actionRouter.js`
+ new `src/services/orchestrator.service.js`) that forwards to the Python
orchestrator's `POST /orchestrate` — the same intent-classification path
voice/form input already goes through, so a WhatsApp message gets treated
identically: classified, and turned into a grievance or ID-request as
appropriate.

**Verified for real**, not just code-reviewed: wrote a document directly
to the live Firestore `gram_seva_requests` collection (using the Node
backend's actual service-account credentials) simulating exactly what n8n
would produce, and watched it flow through the running Node backend → Python
orchestrator → Postgres → back to `gram_seva_responses`, end to end, in
under 2 seconds. The resulting grievance is real and queryable
(`GET /grievances/{id}` returns it with `source_channel: "whatsapp"`).

### What n8n needs to do

Whatever n8n workflow receives the WhatsApp Business webhook needs exactly
one step beyond extracting the phone number and message text: write a
document to the `gram_seva_requests` Firestore collection shaped like
this (document ID can be anything unique — a UUID, or the WhatsApp
message ID):

```json
{
  "status": "pending",
  "action": "handleMessage",
  "payload": {
    "transcript": "<the WhatsApp message text>",
    "language": "en",
    "channel": "whatsapp",
    "citizenId": "<the sender's phone number, e.g. +919900011199>"
  }
}
```

The result appears in `gram_seva_responses/<same-document-id>` shortly
after — `{success: true, data: {intent, downstream: {action, resource_id}, ...}}`
on success, matching `shared/CONTRACT.md` §1's `/orchestrate` response
shape. n8n can poll that document or attach its own `onSnapshot` listener
if it needs to reply back to the citizen on WhatsApp with a status update.

### What's still not connected

- `src/routes/whatsapp.routes.js` (the **old**, pre-existing direct Meta
  webhook handler) is still mounted and still live — it calls
  `aiService.chat()` (Claude/Gemini) directly and bypasses this bridge
  entirely. If n8n is going to own the WhatsApp integration going forward,
  that route should probably be disabled or reconciled with this one, or
  the two will independently double-handle/reply to the same inbound
  messages. Flagging, not fixing — this is a product decision for the team
  (which one is authoritative), not something to silently resolve.
- I don't have n8n itself installed anywhere to configure the actual
  workflow (WhatsApp webhook trigger → this Firestore write) — the above
  contract is what the *receiving* side now correctly handles; the n8n
  workflow itself still needs to be built/pointed at it.
- `src/firebase/verify/hourlyVerification.js` (scheduled hourly, confirmed
  running) is a stub — logs a line, does no actual Firestore/Postgres
  reconciliation. Not related to WhatsApp specifically, but worth knowing
  if you're relying on it for data-integrity checks.

---

## 8. Other devices on the LAN — what to point at what

From a phone, another laptop, or the FlutterFlow app running on the
OnePlus 15, all pointed at `10.91.53.228`:

| Service | URL from another LAN device |
|---|---|
| Python orchestrator | `http://10.91.53.228:8000` |
| Node backend | `http://10.91.53.228:3000` |
| Website | `http://10.91.53.228:5173` |
| Postgres (Python side) | `postgresql://gramseva:gramseva@10.91.53.228:5432/gramseva` |
| Postgres (Node side) | `postgresql://postgres:Hackathon123@10.91.53.228:5432/Gram_Seva_Ai` |
| Ollama | `http://10.91.53.228:11434` |

Ollama itself only binds to `localhost` by default — if another machine
needs to hit it directly (not through the orchestrator), set
`OLLAMA_HOST=0.0.0.0` before `ollama serve` on the machine running it.
