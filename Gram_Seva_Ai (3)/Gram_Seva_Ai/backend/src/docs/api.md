# Gram Seva AI — REST API Reference

**Base URL:** `http://localhost:3000/api`  
**Content-Type:** `application/json`  
**Version:** `1.0.0`

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Human-readable description",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable description",
  "error": "Error detail or code"
}
```

---

## Health Check

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | None |

```bash
curl http://localhost:3000/api/health
```

---

## Citizens `/api/citizens`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/citizens` | None | List all citizens |
| GET | `/api/citizens/:id` | None | Get citizen by ID |
| GET | `/api/citizens/aadhaar/:aadhaar` | None | Get citizen by Aadhaar |
| POST | `/api/citizens` | None | Create citizen |
| PUT | `/api/citizens/:id` | None | Update citizen |
| DELETE | `/api/citizens/:id` | None | Delete citizen |

### POST `/api/citizens` — Create Citizen
```json
{
  "aadhaar": "123456789012",
  "fullName": "Ramesh Kumar",
  "age": 35,
  "gender": "MALE",
  "phone": "9876543210",
  "occupation": "Farmer",
  "annualIncome": 60000,
  "caste": "OBC",
  "address": "Village Rampur, UP",
  "villageId": 1
}
```

---

## Schemes `/api/schemes`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/schemes` | None | List all schemes |
| GET | `/api/schemes?includeRules=true` | None | List schemes with eligibility rules |
| GET | `/api/schemes/search?q=<keyword>` | None | Search schemes by name/department |
| GET | `/api/schemes/:id` | None | Get scheme by ID |
| POST | `/api/schemes` | None | Create scheme |
| PUT | `/api/schemes/:id` | None | Update scheme |
| DELETE | `/api/schemes/:id` | None | Delete scheme |

### POST `/api/schemes` — Create Scheme
```json
{
  "schemeName": "PM Kisan Samman Nidhi",
  "description": "Direct income support to farmers",
  "benefit": "₹6000 per year in 3 instalments",
  "department": "Agriculture"
}
```

---

## Applications `/api/applications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/applications` | None | List all applications |
| GET | `/api/applications/:id` | None | Get application by ID |
| GET | `/api/applications/citizen/:citizenId` | None | All applications by a citizen |
| GET | `/api/applications/scheme/:schemeId` | None | All applications for a scheme |
| POST | `/api/applications` | None | Submit application |
| PATCH | `/api/applications/:id/status` | None | Update application status |
| DELETE | `/api/applications/:id` | None | Delete application |

### POST `/api/applications` — Submit Application
```json
{
  "citizenId": 1,
  "schemeId": 2,
  "remarks": "Supporting documents attached"
}
```

### PATCH `/api/applications/:id/status` — Update Status (Officer)
```json
{
  "status": "APPROVED",
  "remarks": "All documents verified"
}
```
**Status values:** `PENDING` | `UNDER_REVIEW` | `APPROVED` | `REJECTED`

---

## Officers `/api/officers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/officers` | None | List all officers |
| GET | `/api/officers/:id` | None | Get officer by ID |
| GET | `/api/officers/panchayat/:panchayatId` | None | Officers in a panchayat |
| POST | `/api/officers` | None | Create officer |
| PUT | `/api/officers/:id` | None | Update officer |
| DELETE | `/api/officers/:id` | None | Delete officer |

### POST `/api/officers`
```json
{
  "name": "Suresh Patel",
  "email": "suresh@panchayat.gov.in",
  "phone": "9123456789",
  "designation": "Gram Sevak",
  "panchayatId": 1
}
```

---

## Villages `/api/villages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/villages` | None | List all villages |
| GET | `/api/villages/:id` | None | Get village by ID |
| GET | `/api/villages/panchayat/:panchayatId` | None | Villages in a panchayat |
| POST | `/api/villages` | None | Create village |
| PUT | `/api/villages/:id` | None | Update village |
| DELETE | `/api/villages/:id` | None | Delete village |

### POST `/api/villages`
```json
{
  "name": "Rampur",
  "panchayatId": 1
}
```

---

## Panchayats `/api/panchayats`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/panchayats` | None | List all panchayats |
| GET | `/api/panchayats/search?district=<name>` | None | Search by district |
| GET | `/api/panchayats/:id` | None | Get panchayat by ID (incl. villages & officers) |
| POST | `/api/panchayats` | None | Create panchayat |
| PUT | `/api/panchayats/:id` | None | Update panchayat |
| DELETE | `/api/panchayats/:id` | None | Delete panchayat |

### POST `/api/panchayats`
```json
{
  "name": "Rampur Gram Panchayat",
  "district": "Lucknow",
  "state": "Uttar Pradesh",
  "address": "Near NH-28, Lucknow"
}
```

---

## Documents `/api/documents`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/documents` | None | List all documents |
| GET | `/api/documents/:id` | None | Get document by ID |
| GET | `/api/documents/citizen/:citizenId` | None | All documents for a citizen |
| POST | `/api/documents/upload` | None | Upload file (multipart/form-data) |
| POST | `/api/documents` | None | Register external URL |
| DELETE | `/api/documents/:id` | None | Delete document |

### POST `/api/documents/upload` — File Upload
```
Content-Type: multipart/form-data

Fields:
  - file         (required) Binary file — JPEG/PNG/WebP/PDF, max 5MB
  - citizenId    (required) Integer
  - documentType (required) String
```

### POST `/api/documents` — URL Registration
```json
{
  "citizenId": 1,
  "documentType": "AADHAAR",
  "fileUrl": "https://storage.example.com/docs/aadhaar-123.pdf"
}
```
**Document types:** `AADHAAR` | `PAN` | `INCOME_CERTIFICATE` | `CASTE_CERTIFICATE` | `RESIDENCE_PROOF` | `BANK_PASSBOOK` | `PHOTO` | `OTHER`

---

## Eligibility `/api/eligibility`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/eligibility/check?citizenId=&schemeId=` | None | **Run eligibility check** |
| GET | `/api/eligibility` | None | List all eligibility rules |
| GET | `/api/eligibility/:id` | None | Get rule by ID |
| GET | `/api/eligibility/scheme/:schemeId` | None | Rules for a scheme |
| POST | `/api/eligibility` | None | Create rule |
| PUT | `/api/eligibility/:id` | None | Update rule |
| DELETE | `/api/eligibility/:id` | None | Delete rule |

### GET `/api/eligibility/check` — Eligibility Check
```bash
curl "http://localhost:3000/api/eligibility/check?citizenId=1&schemeId=2"
```

Response:
```json
{
  "success": true,
  "message": "Ramesh Kumar is ELIGIBLE for PM Kisan Samman Nidhi.",
  "data": {
    "eligible": true,
    "citizen": { "id": 1, "fullName": "Ramesh Kumar", "age": 35 },
    "scheme": { "schemeName": "PM Kisan Samman Nidhi" },
    "rules": [...],
    "failedRules": [],
    "passedRules": ["Age ≥ 18 ✅", "Income ≤ ₹200000 ✅"]
  }
}
```

### POST `/api/eligibility` — Create Rule
```json
{
  "schemeId": 2,
  "minAge": 18,
  "maxAge": 60,
  "maxIncome": 200000,
  "occupation": "Farmer",
  "caste": null,
  "gender": null
}
```

---

## AI Chat `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | None | Chat with AI assistant |
| GET | `/api/ai/sessions` | None | List AI sessions |
| GET | `/api/ai/sessions/:sessionId` | None | Get a session |
| POST | `/api/ai/tools/eligibility` | None | Direct tool: check eligibility |
| POST | `/api/ai/tools/apply` | None | Direct tool: apply for scheme |
| GET | `/api/ai/tools/track/:applicationId` | None | Direct tool: track application |

### POST `/api/ai/chat`
```json
{
  "prompt": "What schemes are available for farmers with income below 2 lakhs?",
  "model": "claude",
  "sessionId": "sess_abc123"
}
```
**Models:** `claude` | `gemini`  
`sessionId` is auto-generated if not provided.

Response:
```json
{
  "success": true,
  "message": "AI response generated",
  "data": {
    "sessionId": "sess_abc123-...",
    "model": "claude-sonnet-4-6",
    "response": "There are several schemes available for farmers..."
  }
}
```

---

## Audit Logs `/api/audit`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audit?limit=50` | None | List recent audit logs |
| GET | `/api/audit/entity?entity=Citizen&entityId=1` | None | Logs for a specific entity |
| GET | `/api/audit/actor?actor=AI_AGENT` | None | Logs by actor |

---

## WhatsApp Webhook `/api/whatsapp`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/whatsapp/webhook` | Verify Token | Meta webhook verification |
| POST | `/api/whatsapp/webhook` | Meta HMAC | Inbound message handler |
| GET | `/api/whatsapp/status` | None | Webhook configuration status |

### Webhook Verification
Meta sends a GET with `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`.
Set `WHATSAPP_VERIFY_TOKEN` in `.env` to match what you configure in Meta Console.

---

## MCP Server `/mcp`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/mcp/health` | None | MCP server health |
| GET | `/mcp/tools` | None | List all available tools |
| POST | `/mcp/call` | None | Execute a tool |

### POST `/mcp/call` — Execute Tool
```json
{
  "name": "checkEligibility",
  "input": {
    "citizenId": 1,
    "schemeId": 2
  }
}
```

**Available tools:** `registerCitizen` · `findCitizen` · `findScheme` · `checkEligibility` · `applyScheme` · `trackApplication` · `uploadDocument` · `raiseComplaint` · `listDocuments`

---

## Error Reference

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing/invalid JWT |
| 403 | Forbidden — access denied |
| 404 | Not Found |
| 409 | Conflict — duplicate entry |
| 500 | Internal Server Error |

### Prisma Error Mappings
| Code | HTTP | Description |
|------|------|-------------|
| P2002 | 409 | Unique constraint violation |
| P2003 | 400 | Foreign key constraint failed |
| P2025 | 404 | Record not found |