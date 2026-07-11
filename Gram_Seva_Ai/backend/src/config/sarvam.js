/**
 * Sarvam AI client configuration.
 * Sarvam provides speech-to-text, text-to-speech, and translation APIs for Indian languages.
 * Falls back gracefully if API key is not set.
 *
 * Usage:
 *   const { getSarvamHeaders, isSarvamAvailable, SARVAM_BASE_URL } = require('./sarvam');
 */

const config = require('./env');
const logger = require('../config/logger');

/**
 * Returns true if the Sarvam API key is configured.
 */
const isSarvamAvailable = () => Boolean(config.sarvamApiKey);

/**
 * Returns headers required for Sarvam AI API calls.
 * Returns null if not configured.
 */
const getSarvamHeaders = () => {
  if (!isSarvamAvailable()) {
    logger.warn('Sarvam AI API key not configured. Sarvam features will be unavailable.');
    return null;
  }

  return {
    'api-subscription-key': config.sarvamApiKey,
    'Content-Type': 'application/json',
  };
};

/** Available Sarvam endpoints */
const SARVAM_ENDPOINTS = Object.freeze({
  SPEECH_TO_TEXT: '/speech-to-text',
  TEXT_TO_SPEECH: '/text-to-speech',
  TRANSLATE: '/translate',
  TRANSLITERATE: '/transliterate',
});

/** Supported Indian language codes */
const SARVAM_LANGUAGES = Object.freeze({
  HINDI: 'hi-IN',
  MARATHI: 'mr-IN',
  TAMIL: 'ta-IN',
  TELUGU: 'te-IN',
  KANNADA: 'kn-IN',
  BENGALI: 'bn-IN',
  GUJARATI: 'gu-IN',
  PUNJABI: 'pa-IN',
  ODIA: 'or-IN',
  ENGLISH: 'en-IN',
});

module.exports = {
  isSarvamAvailable,
  getSarvamHeaders,
  SARVAM_BASE_URL: config.sarvamBaseUrl,
  SARVAM_ENDPOINTS,
  SARVAM_LANGUAGES,
};
