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
| A real Whisper/STT model in Ollama | ⚠️ **Misleading** — `karanchopda333/whisper:latest` is pulled, but its own metadata (`family: llama`, `parameter_size: 3.2B`, `capabilities: [completion, tools]`) shows it's a **text LLM (Llama 3.2 3B), not a speech-to-text model.** It cannot transcribe audio. Don't rely on this for voice intake until it's replaced with a real ASR model — see §3.3. |
| Node.js / npm | ❌ Not installed on this machine — needed for the backend (`Gram_Seva_Ai (3)/Gram_Seva_Ai/backend`) and the website |
| Python venv (`.venv`) | ✅ Set up, dependencies installed |
| "Genie CLI" for Gemma | ❌ Not found anywhere on this machine (checked `PATH`, `Program Files`, `AppData`). If you run it from elsewhere, see §3.2. |

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

### 3.3 Whisper (voice transcription) — needs a real fix, not just a start command

The model currently in Ollama (`karanchopda333/whisper:latest`) **is not a
speech-to-text model** — see §0. Starting it won't give you working voice
transcription. Two real options:

**Option A — pull an actual local Whisper server** (not through Ollama,
since Ollama doesn't serve real audio-transcription models). e.g.
[`faster-whisper-server`](https://github.com/fedirz/faster-whisper-server)
or `whisper.cpp`'s server mode, either exposing the OpenAI-compatible
`/v1/audio/transcriptions` endpoint `orchestrator/speech.py` already
targets. Then in `.env`:
```
STT_BACKEND=whisper
WHISPER_STT_URL=http://localhost:<its-port>/v1/audio/transcriptions
```

**Option B — use the Whisper model already sitting on this machine.** You
have `whisper_large_v3_turbo-precompiled_qnn_onnx-float-qualcomm_snapdragon_x_elite`
in Downloads (2GB, NPU-accelerated ONNX build — this is the "real" answer
for the Snapdragon X Elite pitch specifically). This needs a small ONNX
Runtime + QNN execution-provider serving script wrapped in the same
`/v1/audio/transcriptions` shape — not built yet. Say the word and I'll
build that wrapper; it's a better fit for the hackathon's NPU-acceleration
story than a generic Ollama-served model would be anyway.

Until either is done, leave `STT_BACKEND=stub` — voice-intake requests
will return a clear error instead of silently mistranscribing.

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
