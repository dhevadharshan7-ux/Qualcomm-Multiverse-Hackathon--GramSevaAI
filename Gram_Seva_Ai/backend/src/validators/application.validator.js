/**
 * Application Validator — validates the request body for creating an application.
 * Follows the same function-based pattern as citizen.validator.js.
 */

exports.applicationSchema = (data) => {
  const errors = [];

  if (!data.citizenId || isNaN(data.citizenId) || Number(data.citizenId) <= 0) {
    errors.push('Valid citizenId is required.');
  }

  if (!data.schemeId || isNaN(data.schemeId) || Number(data.schemeId) <= 0) {
    errors.push('Valid schemeId is required.');
  }

  if (data.remarks !== undefined && typeof data.remarks !== 'string') {
    errors.push('Remarks must be a string.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};

/**
 * Validates status update requests (officer action).
 */
exports.statusUpdateSchema = (data) => {
  const VALID_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
  const errors = [];

  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};