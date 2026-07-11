/**
 * Centralised environment configuration.
 * All process.env reads live here — nowhere else in the codebase.
 */

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'INFO',

  // Database
  dbUrl: process.env.DATABASE_URL,

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'gram-seva-dev-secret-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

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
};

module.exports = config;