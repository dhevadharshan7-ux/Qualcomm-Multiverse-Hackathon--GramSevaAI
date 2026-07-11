/**
 * Eligibility Validator — validates request body for creating an eligibility rule.
 */

exports.eligibilityRuleSchema = (data) => {
  const errors = [];

  if (!data.schemeId || isNaN(data.schemeId) || Number(data.schemeId) <= 0) {
    errors.push('Valid schemeId is required.');
  }

  if (data.minAge !== undefined && (isNaN(data.minAge) || Number(data.minAge) < 0)) {
    errors.push('minAge must be a non-negative number.');
  }

  if (data.maxAge !== undefined && (isNaN(data.maxAge) || Number(data.maxAge) < 0)) {
    errors.push('maxAge must be a non-negative number.');
  }

  if (
    data.minAge !== undefined &&
    data.maxAge !== undefined &&
    Number(data.minAge) > Number(data.maxAge)
  ) {
    errors.push('minAge cannot be greater than maxAge.');
  }

  if (data.maxIncome !== undefined && (isNaN(data.maxIncome) || Number(data.maxIncome) < 0)) {
    errors.push('maxIncome must be a non-negative number.');
  }

  if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
    errors.push('gender must be MALE, FEMALE, or OTHER.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};
