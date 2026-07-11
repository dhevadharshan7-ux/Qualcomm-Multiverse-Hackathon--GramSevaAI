/**
 * Centralised environment configuration.
 * All process.env reads live here — nowhere else in the codebase.
 */

require('dotenv').config();

const JWT_SECRET_FALLBACK = 'gram-seva-dev-secret-change-in-prod';
const jwtSecretFromEnv = process.env.JWT_SECRET;

if (!jwtSecretFromEnv) {
  // Loud, impossible-to-miss warning — must fire on every boot, not just be
  // a quiet log line, because a forgotten JWT_SECRET means every officer
  // JWT can be forged by anyone who has read this repo's source.
  console.warn(
    [
      '',
      '╔══════════════════════════════════════════════════════════════════════╗',
      '║   ⚠️  SECURITY WARNING: JWT_SECRET IS NOT SET  ⚠️                       ║',
      '║                                                                         ║',
      '║   Falling back to an INSECURE, PUBLICLY-KNOWN default secret.         ║',
      '║   Any officer JWT issued right now can be forged by anyone who has    ║',
      '║   read this source code (it is committed to git).                     ║',
      '║                                                                         ║',
      '║   Set JWT_SECRET in your .env file before deploying anywhere real.    ║',
      '╚══════════════════════════════════════════════════════════════════════╝',
      '',
    ].join('\n')
  );
}

const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'INFO',

  // Database
  dbUrl: process.env.DATABASE_URL,

  // Auth
  jwtSecret: jwtSecretFromEnv || JWT_SECRET_FALLBACK,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Officer login tokens use a shorter-lived expiry than the general default above.
  officerJwtExpiresIn: process.env.OFFICER_JWT_EXPIRES_IN || '12h',

  // Anthropic / Claude
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,

  // Google Vertex AI
  vertexProjectId: process.env.VERTEX_PROJECT_ID || null,
  vertexLocation: process.env.VERTEX_LOCATION || 'us-central1',

  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || null,

  // Sarvam AI
  sarvamApiKey: process.env.SARVAM_API_KEY || null,
  sarvamBaseUrl: process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai',

  // WhatsApp
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'gram-seva-whatsapp-token',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || null,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,

  // File uploads
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Python Orchestrator / Grievance Platform (teammate's FastAPI service)
  pythonOrchestratorUrl: process.env.PYTHON_ORCHESTRATOR_URL || 'http://localhost:8000',

  // Firebase Admin (Firestore bridge — see src/firebase/)
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || null,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || null,
};

module.exports = config;