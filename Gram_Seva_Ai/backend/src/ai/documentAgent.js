/**
 * Document Agent — AI-assisted document type detection and validation.
 * Future: integrate with Sarvam AI or Whisper for OCR analysis.
 */

const logger = require('../config/logger');

/**
 * Classify a document type from its filename or description.
 * Currently a rule-based stub. Replace with AI/OCR in production.
 *
 * @param {string} filename - Filename or description
 * @returns {string} - Detected document type
 */
const classifyDocument = (filename = '') => {
  const lower = filename.toLowerCase();
  if (lower.includes('aadhaar') || lower.includes('aadhar')) return 'AADHAAR';
  if (lower.includes('pan')) return 'PAN';
  if (lower.includes('income')) return 'INCOME_CERTIFICATE';
  if (lower.includes('caste')) return 'CASTE_CERTIFICATE';
  if (lower.includes('residence') || lower.includes('address')) return 'RESIDENCE_PROOF';
  if (lower.includes('passbook') || lower.includes('bank')) return 'BANK_PASSBOOK';
  if (lower.includes('photo') || lower.includes('photo')) return 'PHOTO';
  logger.debug('Document type could not be auto-detected', { filename });
  return 'OTHER';
};

module.exports = { classifyDocument };