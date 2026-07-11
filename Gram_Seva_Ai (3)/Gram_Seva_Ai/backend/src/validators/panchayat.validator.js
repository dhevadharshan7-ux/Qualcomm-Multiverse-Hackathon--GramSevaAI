/**
 * Panchayat Validator — validates request body for creating/updating a panchayat.
 */

exports.panchayatSchema = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('name is required.');
  }

  if (!data.district || data.district.trim() === '') {
    errors.push('district is required.');
  }

  if (!data.state || data.state.trim() === '') {
    errors.push('state is required.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};
