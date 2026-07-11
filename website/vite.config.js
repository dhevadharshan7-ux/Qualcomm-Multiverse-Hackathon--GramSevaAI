import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server fixed to 5173 to match Gram_Seva_Ai/backend's default
// CORS_ORIGIN (see src/app.js) — the Node backend was already built
// expecting a Vite/React frontend on this exact port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
