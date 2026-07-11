# Gram Seva AI Backend

A production-ready backend for an AI-powered Government Assistance Platform.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your values — **`JWT_SECRET` must
   be set to a real random value for anything beyond local dev** (see
   `SECURITY_CHANGES.md` for what happens if you leave it unset).
3. `npm run prisma:migrate` (applies migrations, including
   `add_officer_password` and `scheme_catalog_fields`) then `npm run prisma:seed`.
4. `npm run dev`

## Scheme catalog

`prisma/seed.js` imports 38 real central-government schemes (PM-KISAN,
Ayushman Bharat, MGNREGA, etc.) from `prisma/data/schemes.csv` — sourced
from the team's Firebase "schemes" collection — upserted by `schemeName`
so re-seeding is idempotent. These only carry `schemeName`/`description`/
`schemeUrl`, not `benefit`/`department` (that finer structure, plus
attached `EligibilityRule`s, is for schemes an officer configures by hand
through the API — both are optional on the `Scheme` model now). They're
included in the 60-second `gram_seva_live` mirror alongside citizens,
applications, and grievances.

## Dev officer login

The seed script (`prisma/seed.js`) creates one officer with a working login,
for local demo purposes only:

```
POST /api/auth/officer/login
{
  "email": "officer1@gramseva.dev",
  "password": "dev-only-change-me"
}
```

This is a **dev-only password, committed in plaintext to the seed script**.
Change it (or seed a different one) before any real deployment. The returned
JWT is required as a `Bearer` token on every officer-only route — see
`SECURITY_CHANGES.md` for the full list of which routes need it and which
are deliberately left open for citizen self-service.

See `SECURITY_CHANGES.md` in this directory for the full rundown of the
recent security hardening pass (auth, rate limiting, the Firebase bridge,
and the locked-down document downloads).