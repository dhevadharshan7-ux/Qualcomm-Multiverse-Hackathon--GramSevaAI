/**
 * Application-wide constants for Gram Seva AI
 * Never hardcode these values anywhere else — always import from here.
 */

const GENDER = Object.freeze({
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
});

const APPLICATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

const AI_MODELS = Object.freeze({
  CLAUDE: 'claude-sonnet-4-6',
  GEMINI: 'gemini-2.0-flash',
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
});

const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE_ENTRY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  AI_ERROR: 'AI_SERVICE_ERROR',
  INELIGIBLE: 'INELIGIBLE',
});

const UPLOAD_DIR = 'uploads';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const WHATSAPP = Object.freeze({
  VERIFY_TOKEN_HEADER: 'hub.verify_token',
  CHALLENGE_HEADER: 'hub.challenge',
  MODE_HEADER: 'hub.mode',
  SUBSCRIBE_MODE: 'subscribe',
});

module.exports = {
  GENDER,
  APPLICATION_STATUS,
  AI_MODELS,
  HTTP_STATUS,
  ERROR_CODES,
  UPLOAD_DIR,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  WHATSAPP,
};