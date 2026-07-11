# Gram Seva AI — Shared Contract (v0.2)

This is the interface boundary between the workstreams:

- **Voice/WhatsApp pipeline / website / mobile app** → produces the orchestrator's input payload
- **Orchestrator core + Grievance Platform + ID Services** (this repo owner) → consumes it, classifies intent, extracts fields, routes
- **Postgres / farmer-produce module** (Varshini) → owns `farmer_produce_entry` persistence and shares the Postgres instance
- **Node/Prisma backend** (`Gram_Seva_Ai/backend/`) → owns citizens, schemes, eligibility, applications, documents; bridges to Firebase per `react_firebase_integration.md`

Everyone builds against this doc. Changing a shape here is a breaking change — flag it in the team channel before editing. See also `shared/DATA_GOVERNANCE.md` for the Responsible AI / security constraints every module here must respect.

---

## 1. Voice pipeline → Orchestrator (`POST /orchestrate`)

### Request

```jsonc
{
  "transcript": "string, required — ASR output or WhatsApp/form text, raw, un-normalized",
  "language": "en | hi | kn | pa | mr | ta",  // required, extensible
  "channel": "voice | whatsapp | form",  // required
  "citizen_id": "string | null",         // phone number or panchayat-issued id, if known
  "metadata": {                          // optional, channel-specific passthrough
    "device": "string | null",           // e.g. "oneplus15", "office-pc"
    "location": "string | null",         // free text or lat,lon if the client has it
    "timestamp": "ISO 8601 string"       // when the utterance was captured, not received
  }
}
```

- `transcript` is the only hard requirement. Everything else may be `null`/omitted and the orchestrator must not crash.
- `language` drives which locale hints Gemma4 gets; unknown/undetected → pipeline sends `"en"` and the orchestrator treats it as best-effort.
- Field extraction (below) may pull a better `location`/`citizen_id` out of the transcript itself than what's in `metadata` — orchestrator prefers extracted values but falls back to `metadata`.

### Response

```jsonc
{
  "request_id": "uuid",
  "intent": "new_grievance | grievance_status_check | new_application | eligibility_check | farmer_produce_entry | id_update_request",
  "confidence": 0.0,                     // 0.0-1.0
  "routed_to": "local | cloud_escalated",
  "extracted_fields": { /* intent-specific shape, see §2 */ },
  "downstream": {                        // what the orchestrator did with it, if anything
    "action": "grievance_created | none | ...",
    "resource_id": "string | null"       // e.g. grievance id, if one was created inline
  }
}
```

`intent` is an **extensible enum** — new values may be added; consumers must not hard-fail on an unrecognized one (log + treat as `other`/no-op).

---

## 2. Extracted-field shapes per intent

These are the Pydantic models the orchestrator produces internally and exposes in `extracted_fields`. The Grievance Platform consumes the `new_grievance` shape directly.

### `new_grievance`

```jsonc
{
  "citizen_id": "string | null",         // phone preferred
  "category": "streetlight | water | road_damage | electricity | sanitation | corruption | other",
  "description": "string",               // cleaned-up summary, not raw transcript
  "location": "string | null",
  "priority": "low | medium | high",     // orchestrator's initial guess; grievance module may re-derive
  "source_channel": "voice | whatsapp | form"
}
```

### `grievance_status_check`

```jsonc
{ "grievance_id": "string | null", "citizen_id": "string | null" }
```
(at least one of the two must be present; Grievance Platform resolves by id first, else latest-by-citizen)

### `new_application` / `eligibility_check`

```jsonc
{
  "scheme_name": "string | null",
  "citizen_id": "string | null",
  "details": { "...": "free-form key/value, scheme-specific" }
}
```
(placeholder shape — not implemented in this hackathon pass, reserved so the enum is future-proof)

### `farmer_produce_entry`

```jsonc
{
  "citizen_id": "string | null",
  "crop": "string | null",
  "quantity": "number | null",
  "unit": "string | null",
  "location": "string | null"
}
```
(shape owned by Varshini's module — orchestrator only extracts and hands off, does not persist this one)

### `id_update_request`

```jsonc
{
  "citizen_id": "string | null",
  "id_type": "aadhaar | pan | driving_license | other",
  "update_type": "string",               // short label, e.g. "address_change", "name_correction"
  "description": "string",
  "source_channel": "voice | whatsapp | form"
}
```
**This is a request to correct/update a document — the system never writes to UIDAI/NSDL/Parivahan.** See §4.5 and `shared/DATA_GOVERNANCE.md` §1.

---

## 3. Device Abstraction Layer (DAL) contract

Single interface, both orchestrator and Grievance Platform call this — never touch a device driver directly.

```python
dal.read(device: str, resource: str) -> DeviceReading
dal.write(device: str, resource: str, payload: dict) -> DeviceReading
```

```jsonc
// DeviceReading
{
  "device": "arduino_uno_q",
  "resource": "streetlight_status | water_pump_status",
  "value": { "...": "resource-specific" },   // e.g. {"on": true} or {"flow_lpm": 12.4}
  "read_at": "ISO 8601 string",
  "source": "simulated | live"
}
```

- Backends are dependency-injected behind `dal.read`/`dal.write`; swapping simulated → real serial/GPIO must not require orchestrator or Grievance Platform code changes.
- Unknown `(device, resource)` pairs raise a typed `DALResourceNotFound` — callers must handle it, not assume every read succeeds.

---

## 4. Grievance Platform API

### `POST /grievances`

Input: the `new_grievance` shape from §2 (called internally by the orchestrator, but also directly usable for testing/offline form submission).

Output:

```jsonc
{
  "id": "uuid",
  "citizen_id": "string | null",
  "category": "streetlight | water | road_damage | electricity | sanitation | corruption | other",
  "description": "string",
  "location": "string | null",
  "priority": "low | medium | high",
  "source_channel": "voice | whatsapp | form",
  "status": "submitted | verified | disputed | in_progress | resolved",
  "department": "string",                // resolved via config-driven category->dept map
  "sensor_check": {                       // present only for streetlight/water categories
    "device": "arduino_uno_q",
    "resource": "string",
    "value": { "...": "..." },
    "verdict": "verified | disputed"
  } | null,
  "created_at": "ISO 8601 string",
  "updated_at": "ISO 8601 string"
}
```

### `GET /grievances/{id}`

Returns the same shape. Must resolve from local Postgres only — zero network dependency.

### Status lifecycle

```
submitted -> (verified | disputed) -> in_progress -> resolved
```

`verified`/`disputed` is set at creation time for streetlight/water categories based on the DAL sensor cross-check; other categories start at `submitted` and skip straight to `in_progress` on department action.

---

## 4.5. ID Services API

### `POST /id-requests`

Input: the `id_update_request` shape from §2.

Output:

```jsonc
{
  "id": "uuid",
  "citizen_id": "string | null",
  "id_type": "aadhaar | pan | driving_license | other",
  "update_type": "string",
  "description": "string",
  "source_channel": "voice | whatsapp | form",
  "status": "submitted | document_review | ready_for_submission | submitted_to_authority | completed | rejected",
  "authority_office": "string",           // config-driven, id_services/config/routing.yaml — the physical office the citizen must still visit
  "extracted_fields": { "...": "string" } | null,  // OCR output, PII-masked (see below)
  "document_ref": "string | null",
  "created_at": "ISO 8601 string",
  "updated_at": "ISO 8601 string"
}
```

### `GET /id-requests/{id}`

Same shape, resolved from local Postgres.

### `POST /id-requests/{id}/document` (multipart, field `file`)

Runs the document/ID vision-OCR model (`orchestrator/vision.py`) against an uploaded photo, moves `status` to `document_review`, and returns `{ request: <above shape>, warnings: string[] }`.

**Non-negotiable:** any Aadhaar/PAN-shaped value the vision model returns is masked to its last 4 characters (`orchestrator/vision.py: mask_sensitive_fields`) before it is ever persisted or returned — enforced by `tests/test_id_services.py`, not just documented. No endpoint in this system returns or stores a full government ID number.

---

## 5. Postgres — shared instance, table ownership

Single local Postgres (docker-compose in `/infra`), tables partitioned by owner to avoid collisions:

| Table | Owner | Notes |
|---|---|---|
| `grievances` | Grievance Platform (this repo) | per §4 shape |
| `device_state` | DAL / orchestrator | mirrors simulated Arduino state, latest reading per resource |
| `id_update_requests` | ID Services (this repo) | per §4.5 shape |
| `farmer_produce` | Varshini | not defined here — coordinate directly, this doc reserves the name only |
| `citizens`, `schemes`, `applications`, `documents`, `panchayats`, `villages`, `officers`, `audit_log`, `ai_sessions` | Node/Prisma backend (`Gram_Seva_Ai/backend/prisma/schema.prisma`) | separate migration history (Prisma, not `shared/schema.sql`), same Postgres instance |

Before adding a table to `shared/schema.sql`, check both that file **and** `Gram_Seva_Ai/backend/prisma/schema.prisma` to avoid clashing with tables already defined on either side — this instance now has two independent migration histories against it.

---

## 6. Sync-to-cloud (non-blocking, best-effort)

- `sync_to_gov_cloud()` (Grievance Platform) and `cloud_escalate()` (orchestrator) are both **stubs** for this hackathon — log the call and return a mocked response, no real network call.
- Both must be fire-and-forget with respect to the local write path: a failure or timeout in either must never fail or roll back the local Postgres write.
- Separately, the Node backend's Firebase bridge (`gram_seva_requests`/`gram_seva_responses`/`gram_seva_live`, see `react_firebase_integration.md`) is a **real, working** sync path for the citizen/scheme domain — not a stub. Its 60-second Postgres→`gram_seva_live` mirror is the "both databases updated every minute" requirement; it is best-effort/non-blocking with respect to Postgres writes, same principle as the stubs above.

---

## 7. Open questions for team sign-off

1. `priority` — orchestrator guesses it from the transcript; should Grievance Platform ever override it (e.g. corruption always → high)? *(implemented: corruption always → high, see `orchestrator/classifier.py`)*
2. `citizen_id` format — raw phone string vs normalized E.164? *(still open — not normalized anywhere yet, both backends currently accept raw strings)*
3. Does Varshini's `farmer_produce` table already exist anywhere, or is this repo defining it first? *(still blocking — confirm before adding it to either `shared/schema.sql` or the Prisma schema)*
4. Corruption-complaint visibility — should the general officer dashboard (Node backend) be able to see corruption-category grievances, or should that be scoped to a Vigilance Cell / audit role only? *(recommended in `shared/DATA_GOVERNANCE.md` §4, not yet enforced by either backend's auth layer)*
5. `Gram_Seva_Ai/backend`'s Firestore security rules for `gram_seva_requests`/`gram_seva_responses`/`gram_seva_live` haven't been written — needed before any untrusted client talks to Firebase directly.
