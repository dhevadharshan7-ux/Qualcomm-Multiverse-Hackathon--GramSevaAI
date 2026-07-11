/**
 * AI Validator — validates request body for AI chat and eligibility check endpoints.
 */

exports.chatSchema = (data) => {
  const errors = [];

  if (!data.prompt || typeof data.prompt !== 'string' || data.prompt.trim() === '') {
    errors.push('prompt is required and must be a non-empty string.');
  }

  if (data.prompt && data.prompt.length > 8000) {
    errors.push('prompt must be 8000 characters or fewer.');
  }

  // sessionId is optional — will be auto-generated if absent
  if (data.sessionId !== undefined && typeof data.sessionId !== 'string') {
    errors.push('sessionId must be a string.');
  }

  // model is optional — defaults to Claude
  const VALID_MODELS = ['claude', 'gemini'];
  if (data.model !== undefined && !VALID_MODELS.includes(data.model)) {
    errors.push(`model must be one of: ${VALID_MODELS.join(', ')}.`);
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};
