# Security Hardening Pass — Gram Seva AI Backend

This documents everything changed in `Gram_Seva_Ai/backend/` in this pass, why,
and what's still open. Nothing outside `Gram_Seva_Ai/backend/` was touched
(the Python `orchestrator`/`grievance` service and the Flutter frontend are
owned by teammates and were only *read* — `/shared/CONTRACT.md` and
`/shared/schema.sql` — to get the grievance API contract right).

---

## 1. Officer auth (real, not a stub)

**New files**
- `src/services/auth.service.js` — `loginOfficer({ email|phone, password })`: looks up the officer, `bcrypt.compare`s the password, signs a JWT (`{ officerId, panchayatId, designation }`, `config.jwtSecret`, expiry from `config.officerJwtExpiresIn`, default `12h`).
- `src/controllers/auth.controller.js`, `src/routes/auth.routes.js` — `POST /api/auth/officer/login`, mounted at `/api/auth` in `src/app.js`.

**Schema / migration**
- `prisma/schema.prisma` — added `passwordHash String?` to `Officer`.
- `prisma/migrations/20260711120000_add_officer_password/migration.sql` (new, **hand-written**):
  ```sql
  -- AlterTable
  ALTER TABLE "Officer" ADD COLUMN "passwordHash" TEXT;
  ```
  **I could not run `npx prisma migrate dev` or verify this against a live
  Postgres instance** — this sandbox has no `node`/`npm` on `PATH` at all (not
  a DB-reachability issue; the Node runtime itself isn't installed/exposed
  here), so I hand-wrote the migration file in the exact style of the
  existing `20260711100244_init/migration.sql`. It's a single additive,
  nullable-column `ALTER TABLE`, about as low-risk as a migration gets, but
  **someone needs to run `npx prisma migrate deploy` (or `migrate dev`)
  against the real dev DB before this is trustworthy**, and ideally diff the
  generated Prisma Client against `@prisma/client` output once that's done.

**Seed**
- `prisma/seed.js` now upserts one officer with a bcrypt-hashed password:
  - Email: `officer1@gramseva.dev`
  - Password: **`dev-only-change-me`**
  - This is printed to the console when the seed runs, and documented in
    `backend/README.md`. It is a placeholder for the hackathon demo only —
    rotate it (or seed a different one) before any real deployment.

**Route gating** (`src/middleware/auth.js` applied — it already worked, it
was just never used anywhere):

| Route | Guard |
|---|---|
| `PATCH /api/applications/:id/status` | auth |
| `DELETE /api/applications/:id` | auth *(see note below)* |
| `DELETE /api/citizens/:id` | auth |
| `POST/PUT/DELETE /api/officers` | auth |
| `POST/PUT/DELETE /api/villages` | auth |
| `POST/PUT/DELETE /api/panchayats` | auth |
| `POST/PUT/DELETE /api/schemes` | auth |
| `POST/PUT/DELETE /api/eligibility` | auth |
| `DELETE /api/documents/:id` | auth |
| `GET /api/documents/:id/file` (new route, see §6) | auth |
| `GET/entity/actor /api/audit/*` | auth (all of it) |

Note: `DELETE /api/applications/:id` wasn't in the literal list I was handed
(only `PATCH /:id/status` was called out for applications), but it's the
same class of destructive officer action as the other DELETEs, so I added
`auth` there too for consistency and flagged it inline in
`application.routes.js`. Flagging this as a deliberate small scope extension,
not a silent one.

**Deliberately left open** (product decision, not an oversight — the
platform's whole premise per its architecture docs is a villager speaking
with no account/login):
- Citizen registration/lookup/update (`POST`/`GET`/`PUT /api/citizens*`)
- Scheme browsing (`GET /api/schemes*`)
- Eligibility check (`GET /api/eligibility/check`, and rule reads)
- Application submission (`POST /api/applications`)
- Document upload (`POST /api/documents`, `POST /api/documents/upload`)
- All the `GET` list/lookup endpoints needed to drive the above by voice

**Aadhaar lookup** (`GET /api/citizens/aadhaar/:aadhaar`) — kept
**unauthenticated on purpose** (per the task), but:
- `src/routes/citizen.routes.js`: `express-rate-limit` scoped only to this
  route — 10 requests/hour/IP.
- `src/controllers/citizen.controller.js`: every attempt (found or not) is
  written to `AuditLog` via the existing `auditlog.service.js`, actor
  `'PUBLIC_LOOKUP'`, with the queried Aadhaar and found/not-found — not any
  other citizen's data.

**Bonus fix (not explicitly asked, but a real bug I found while wiring
auth):** `src/repositories/officer.repository.js`'s `findAll`/`findById`/
`findByPanchayatId`/`create`/`update` used Prisma `include`, which returns
*every* scalar column — including the brand-new `passwordHash`. That would
have leaked every officer's bcrypt hash through `GET /api/officers` and
`GET /api/officers/:id` the moment the column existed. Rewrote those to
explicit `select` blocks that exclude `passwordHash`. Added `findByPhone`
(officer login by phone) and kept `findByEmail`/`findByPhone` as
auth-internal-only (full row, including the hash) with a comment warning
never to return their result straight to a client.

---

## 2. `JWT_SECRET` hardening

`src/config/env.js`: if `JWT_SECRET` is unset, the server still falls back to
the existing dev literal (`gram-seva-dev-secret-change-in-prod`) for local
dev convenience, but now prints a boxed, impossible-to-miss `console.warn`
banner every boot explaining that any officer JWT can be forged by anyone
who's read the source. This fires once per process start (module load, not
per-request).

`.env.example` (new) mirrors `.env`'s variable names with placeholders/empty
values (no real secrets), with `JWT_SECRET` called out as required for any
real deployment, plus the new `OFFICER_JWT_EXPIRES_IN`,
`PYTHON_ORCHESTRATOR_URL`, and `FIREBASE_*` vars.

---

## 3. Firebase sync worker wired into boot

`src/server.js`: after `app.listen(...)` succeeds, if `firebaseDb` (from
`require('./firebase')`, itself a snapshot of `firebaseAdmin.js`'s `db`) is
non-null, calls `startSyncWorker()` **and** `startLiveSync()` (§5). If
Firebase Admin never initialized (any of `FIREBASE_PROJECT_ID` /
`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` missing), it logs that the
bridge is inactive and does nothing else — doesn't crash, doesn't retry.
Both are stopped in the graceful-shutdown handler (`stopSyncWorker()` /
`stopLiveSync()`) alongside the existing Prisma disconnect.

---

## 4. `raiseComplaint` / `listComplaints` implemented

**New file:** `src/services/grievance.service.js` — follows the existing
service-layer convention (`requestRouter.js` → `services/*.js`), except this
one talks HTTP instead of Prisma, since grievances are owned by the
teammate's Python FastAPI Grievance Platform (confirmed against
`/shared/CONTRACT.md` §4 and `/shared/schema.sql`, and `orchestrator/main.py`
which mounts it on port 8000).

- `raiseComplaint(payload)` → `POST {PYTHON_ORCHESTRATOR_URL}/grievances`
  with the `new_grievance` shape (`citizen_id`, `category`, `description`,
  `location`, `priority`, `source_channel`; accepts camelCase or snake_case
  input keys). Returns the created grievance record.
- `listComplaints(payload)` → `GET {PYTHON_ORCHESTRATOR_URL}/grievances/{id}`.
  **The Python service only supports lookup-by-id, not "list all"** — this
  is a hard API gap, not something fixable from this side. `payload` must
  include `grievanceId` (or `grievance_id`/`id`); if it's missing, this
  throws a 400 rather than silently returning `[]`.
- Uses plain `fetch` + `AbortSignal.timeout(8000)` (no new dependency —
  `axios` isn't in `package.json`, and this project's stack (Express 5,
  Prisma 6.19, firebase-admin 14) requires Node 18+, where global `fetch` is
  available). Unreachable/non-2xx responses are caught and re-thrown as an
  `Error` with `.statusCode`, matching how every other error in this
  codebase flows to `listener.js`'s catch block, which calls
  `publishResponse(requestId, false, 'Action failed', error.message)` — same
  success/error shape `publisher.js` already expects, no changes needed
  there.

`src/config/env.js`: added `pythonOrchestratorUrl` (`PYTHON_ORCHESTRATOR_URL`,
default `http://localhost:8000`).

`src/firebase/requestRouter.js`: the `raiseComplaint`/`listComplaints` cases
now delegate to `grievance.service.js` instead of returning stub data.

**Not touched (out of explicit scope, flagged here):**
`src/ai/tools.service.js` has a *separate* `raiseComplaint` implementation
(used by the MCP tool of the same name, via `src/mcp/server.js`) that only
writes an `AuditLog` row — it doesn't call the Python service either, and is
now inconsistent with the Firestore-bridge path. Left alone since the task
scoped this to `src/firebase/requestRouter.js` specifically, but the two
should probably be reconciled (either have the MCP tool call
`grievance.service.js` too, or document why they intentionally differ).

---

## 5. 60-second Postgres → `gram_seva_live` mirror

**New file:** `src/firebase/liveSync.js`, exporting `startLiveSync()` /
`stopLiveSync()`, mirroring `syncWorker.js`'s shape. Every 60s
(`setInterval`, no new dependency):
- Citizens and Applications — via Prisma (`prisma.citizen.findMany`,
  `prisma.application.findMany`).
- Grievances — via `prisma.$queryRawUnsafe('SELECT ... FROM grievances ...')`,
  since `grievances` isn't in `prisma/schema.prisma` (it's owned by the
  Python side's SQLAlchemy models per `/shared/CONTRACT.md` §5, but lives in
  the same Postgres instance). Wrapped in try/catch so a missing table (e.g.
  the Python side's schema hasn't been applied yet, or no grievance has been
  raised this run) doesn't kill the sync tick — it just contributes zero
  docs that round and logs a debug line.
- Writes docs shaped `{ type: '<citizen|application|grievance>', data: {...} }`
  to `gram_seva_live`, matching `/react_firebase_integration.md`'s
  `useLiveCitizens()` example exactly (`doc.data().type === 'citizen'`).
- Stable doc IDs (`citizen_${id}`, `application_${id}`, `grievance_${id}`) so
  repeated ticks upsert (`{ merge: true }`) instead of duplicating.
- Firestore batched writes cap at 500 operations — chunks into batches of
  450 to stay safely under that as data grows, rather than assuming the
  demo dataset stays small forever.
- `startLiveSync()`/`stopLiveSync()` exported from `src/firebase/index.js`
  and wired into `src/server.js` right next to `startSyncWorker()`, same
  "only if `firebaseDb` is non-null" guard.

---

## 6. Document downloads locked down

- `src/app.js`: removed `app.use('/uploads', express.static(...))` entirely
  (was: any file in `uploads/` downloadable by anyone who knew/guessed the
  filename, no auth, no check that the requester had anything to do with
  that citizen).
- `src/routes/document.routes.js` / `src/controllers/document.controller.js`:
  new `GET /api/documents/:id/file`, gated with `auth` (officer-only).
  Streams the file from disk via `res.sendFile` (correct `Content-Type` via
  Express's built-in mime lookup) for locally-uploaded documents; for
  documents registered via the external-URL flow (`POST /api/documents` with
  an `https://...` `fileUrl` that isn't on our disk), it 302-redirects to
  that URL instead of trying to stream a file we don't have.
- **Judgment call:** the task said to allow either "the owning citizen" or an
  authenticated officer. This platform has **no citizen auth/session concept
  at all** (by design — see §1) — there's nothing to check a request against
  to prove "this caller is the citizen who uploaded this file." Rather than
  inventing an ad hoc scheme (e.g. trusting a citizenId query param, which
  would be trivially spoofable and defeat the purpose), I made this route
  **officer-only**. Citizens upload documents through the still-open `POST`
  routes but don't need to re-download their own uploads through this API —
  nothing in the existing frontend/voice flow does that. If a citizen-facing
  "view my documents" feature gets built later, it'll need its own identity
  proof (e.g. re-verify by Aadhaar + a fresh OTP/challenge) rather than
  reusing this route as-is.
- `src/services/document.service.js`: uploaded files now store their local
  relative disk path in `fileUrl` (not a public URL). A new
  `toPublicDocument(doc, baseUrl)` helper rewrites `fileUrl` to
  `${baseUrl}/api/documents/:id/file` for locally-stored docs in every GET
  response (`getAll`, `getById`, `getByCitizen`, and the upload response);
  externally-registered `fileUrl`s pass through unchanged. `documentAgent.js`
  (`src/ai/documentAgent.js`) doesn't construct file URLs itself — it's just
  filename-based type classification — so it didn't need changes.

---

## Exact env vars a deployer now needs

| Var | Default if unset | What happens if left unset |
|---|---|---|
| `JWT_SECRET` | hardcoded dev literal | **Insecure**: loud warning banner every boot; every officer JWT can be forged by anyone with the source. Must be set for any real deployment. |
| `OFFICER_JWT_EXPIRES_IN` | `12h` | Fine as-is; only matters if you want a different officer session length. |
| `PYTHON_ORCHESTRATOR_URL` | `http://localhost:8000` | If wrong/unreachable, `raiseComplaint`/`listComplaints` fail gracefully (502-style error surfaced through the normal error path) — doesn't crash the server. |
| `FIREBASE_PROJECT_ID` | — | If this **or** the next two are missing, `firebaseAdmin.js` sets `db = null` and logs a warning; the entire Firestore bridge (request-queue listener, live mirror) stays inactive. REST API is fully unaffected either way. |
| `FIREBASE_CLIENT_EMAIL` | — | Same as above. |
| `FIREBASE_PRIVATE_KEY` | — | Same as above (remember: literal `\n` in the value, this code un-escapes it). |

---

## Known remaining gaps (flagged, not fixed — out of scope or too risky for the remaining time)

1. **Firestore security rules** for `gram_seva_requests` / `gram_seva_responses`
   / `gram_seva_live` still need to be written. The Node backend enforces
   nothing at the Firestore layer — that's Firebase Console / `firestore.rules`
   config, separate from this codebase. Right now, if a client has the public
   web SDK config (meant to be public per Firebase's model), whatever
   Firestore rules are in effect (likely still the default test-mode
   allow-all if nobody's touched them) govern read/write access to those
   three collections directly, bypassing this Express API entirely.
2. **No per-panchayat authorization.** `auth.js` verifies the JWT is valid
   and attaches `req.user` (`{ officerId, panchayatId, designation }`), but
   no route checks that the officer's `panchayatId` matches the resource
   they're mutating. Any authenticated officer can currently edit/delete
   officers, villages, schemes, etc. belonging to *any* panchayat, not just
   their own. Authentication is in place; per-tenant authorization is not.
3. **GET list endpoints for citizens/documents/officers remain fully open**
   (`GET /api/citizens`, `GET /api/documents`, etc.) — the task scoped
   protection to mutations plus the single Aadhaar-lookup route, but a full
   `GET /api/citizens` still returns every citizen's PII (income, caste,
   address, phone) to anyone, no rate limit. Bigger exposure than the
   Aadhaar route in some ways, just not what was asked for in this pass.
4. **No officer password-set/reset flow.** `POST /api/officers` (creating a
   new officer via the API) doesn't accept or generate a password — only the
   seeded demo officer can log in until someone adds a
   set-password/reset-password endpoint or manually patches the DB.
5. **`src/ai/tools.service.js`'s `raiseComplaint`** (MCP tool path) still
   only writes an audit log row and never reaches the Python Grievance
   Platform — see §4. Left alone, out of the explicit scope for this pass.
6. **Pre-existing, unrelated bug noticed in passing:** `server.js` creates
   the uploads directory at `path.join(__dirname, config.uploadDir)` (i.e.
   `backend/src/uploads`), but multer's `diskStorage` destination
   (`document.routes.js`) uses the relative path `config.uploadDir` directly,
   which Node resolves against `process.cwd()` (i.e. `backend/uploads` when
   run via `npm run dev` from the `backend/` root) — two different
   directories. `backend/uploads/` already existed and is presumably where
   files actually land in practice; the new `GET /:id/file` route resolves
   against `process.cwd()` to match multer's real behavior, so this doesn't
   break the new feature, but the underlying inconsistency (and the
   possibly-orphaned `backend/src/uploads` directory) predates this pass and
   wasn't fixed, since it's out of scope.
7. **Migration not run against a live DB** — see §1. Sandbox has no
   `node`/`npm` available at all (confirmed via `where.exe node`, a search of
   `Program Files`, `AppData\Local\Programs`, and common nvm locations —
   nothing found), so nothing in this backend could be executed, including
   `npm run dev`/`node -c` for a runtime check. Everything below is based on
   careful manual review only.

---

## Sanity check performed

Could not run `node -c`, `npm run dev`, or `npx prisma migrate dev` — this
sandbox has no Node.js runtime on `PATH` at all (verified via `where.exe
node`, `Get-Command node`, and directory searches under `Program Files`,
`Program Files (x86)`, `AppData\Local\Programs`, and common nvm install
paths — none found). This is an environment limitation, not a project one;
`node_modules/` exists and `npm install` has clearly been run previously on
this machine by some other tool.

In lieu of that, every changed/created file was re-read in full after
editing and manually checked for: balanced braces/parens, matching
`require`/`module.exports`, consistent `async`/`await` usage, and no
leftover references to removed code (e.g. confirmed nothing still imports
the old `path` used only for the removed static mount in `app.js`, confirmed
`config` is still used elsewhere in files where I removed one usage). I'm
confident in the code's correctness but **this has not been executed**, and
the hand-written migration and the seed script have specifically not been
run against Postgres. Please run `npm run prisma:migrate && npm run
prisma:seed && npm run dev` (or `npm run dev` alone against an existing DB)
as the first real verification step before the demo.
