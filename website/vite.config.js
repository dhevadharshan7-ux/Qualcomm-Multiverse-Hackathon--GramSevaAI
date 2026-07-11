import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server fixed to 5173 to match Gram_Seva_Ai/backend's default
// CORS_ORIGIN (see src/app.js) — the Node backend was already built
// expecting a Vite/React frontend on this exact port.
//
// host: true binds 0.0.0.0 instead of Vite's default localhost-only — the
// panchayat-office LAN demo needs other devices to reach this dev server,
// same reasoning as the orchestrator's --host 0.0.0.0 (see RUNBOOK.md §4/§6).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
