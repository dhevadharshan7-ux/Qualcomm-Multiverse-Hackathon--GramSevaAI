/**
 * Village Validator — validates request body for creating/updating a village.
 */

exports.villageSchema = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('name is required.');
  }

  if (!data.panchayatId || isNaN(data.panchayatId) || Number(data.panchayatId) <= 0) {
    errors.push('Valid panchayatId is required.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};
