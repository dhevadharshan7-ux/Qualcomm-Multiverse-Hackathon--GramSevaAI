/**
 * Shared helper utilities for Gram Seva AI.
 * Pure functions — no side effects, no DB access.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Safely parse an integer ID from a route param string.
 * Throws if the result is NaN or <= 0.
 */
const parseIntId = (rawId) => {
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid ID: "${rawId}"`);
  }
  return id;
};

/**
 * Build a Prisma-compatible skip/take for pagination.
 * Defaults: page=1, limit=20. Max limit=100.
 */
const paginate = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return {
    skip: (page - 1) * limit,
    take: limit,
    meta: { page, limit },
  };
};

/**
 * Strip non-digit characters from a phone string.
 * Returns a 10-digit string or null.
 */
const sanitizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
};

/**
 * Generate a unique session ID for AI sessions.
 */
const generateSessionId = () => `sess_${uuidv4()}`;

/**
 * Build a paginated response wrapper.
 */
const paginatedResponse = (data, total, meta) => ({
  items: data,
  total,
  page: meta.page,
  limit: meta.limit,
  totalPages: Math.ceil(total / meta.limit),
});

/**
 * Omit specified keys from an object (useful for removing sensitive fields).
 */
const omit = (obj, keys = []) => {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
};

/**
 * Check if a value is a non-empty string.
 */
const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

/**
 * Safely parse a float; returns null if invalid.
 */
const parseFloat2 = (val) => {
  const f = parseFloat(val);
  return isNaN(f) ? null : f;
};

module.exports = {
  parseIntId,
  paginate,
  sanitizePhone,
  generateSessionId,
  paginatedResponse,
  omit,
  isNonEmptyString,
  parseFloat2,
};