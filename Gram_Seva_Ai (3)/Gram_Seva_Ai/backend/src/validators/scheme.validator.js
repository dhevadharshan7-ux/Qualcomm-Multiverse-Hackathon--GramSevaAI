/**
 * Scheme Validator — validates request body for creating/updating a scheme.
 */

exports.schemeSchema = (data) => {
  const errors = [];

  if (!data.schemeName || data.schemeName.trim() === '') {
    errors.push('schemeName is required.');
  }

  if (!data.description || data.description.trim() === '') {
    errors.push('description is required.');
  }

  if (!data.benefit || data.benefit.trim() === '') {
    errors.push('benefit is required.');
  }

  if (!data.department || data.department.trim() === '') {
    errors.push('department is required.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};