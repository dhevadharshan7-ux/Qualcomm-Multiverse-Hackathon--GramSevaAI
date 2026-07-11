# Gram Seva AI — Website

Glassmorphic/liquid-glass web client, structured after the FlutterFlow
mobile app (`Frontend/gram_seva_ai/`) — same page flow and seed palette
(indigo/teal/orange), reworked as translucent floating panels over an
animated gradient background instead of flat cards.

**Not yet built/run in this environment — Node.js isn't installed on this
machine, so `npm install`/`npm run dev` haven't been executed here.**
Source files were checked for structural (brace/paren) balance only. Run
the build yourself before demoing:

```bash
npm install
cp .env.example .env.local   # fill in VITE_ORCHESTRATOR_URL, VITE_FIREBASE_*
npm run dev                  # http://localhost:5173
```

## What talks to what

- **Voice, grievances, ID-update requests** → straight to the Python
  orchestrator (`VITE_ORCHESTRATOR_URL`, default `http://localhost:8000`).
  These need low-latency access to the local Whisper/Gemma/vision models,
  so they don't go through Firebase.
- **"My Grievances" live list** → Firestore `gram_seva_live` (see
  `src/api/firebaseBridge.js`), populated by the Node backend's 60-second
  Postgres mirror job. Degrades to a "not connected" message if
  `VITE_FIREBASE_*` isn't set — the core flows above don't need it.
- `src/api/firebaseBridge.js` also implements `sendBridgeRequest`/
  `listenForBridgeResponse` per `react_firebase_integration.md` (the
  `gram_seva_requests`/`gram_seva_responses` queue) for citizen/scheme
  actions the Node backend owns — not yet wired into a page in this pass,
  but ready for a citizen-registration/scheme-browsing page to use.

## Pages

`/` Home · `/grievances` My Grievances (live) · `/grievances/new` Register
(voice or form) · `/grievances/:id` Detail + sensor cross-check ·
`/id-requests` Aadhaar/PAN/DL request (voice or form) · `/id-requests/:id`
Detail + document photo upload (OCR) · `/profile` Language, phone link,
voice toggle.

## Design system

`src/styles/glass.css` — CSS custom properties seeded from
`Frontend/gram_seva_ai/lib/flutter_flow/flutter_flow_theme.dart`
(`--primary: #4b39ef`, `--secondary: #39d2c0`, `--tertiary: #ee8b60`),
extended with `.glass`/`.glass-strong` (blurred translucent panels) and an
animated `.liquid-bg` gradient-blob background. Light-first, with a dark
variant via `prefers-color-scheme`.
