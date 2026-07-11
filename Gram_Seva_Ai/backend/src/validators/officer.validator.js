/**
 * Officer Validator — validates request body for creating/updating an officer.
 */

exports.officerSchema = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('name is required.');
  }

  if (!data.designation || data.designation.trim() === '') {
    errors.push('designation is required.');
  }

  if (!data.panchayatId || isNaN(data.panchayatId) || Number(data.panchayatId) <= 0) {
    errors.push('Valid panchayatId is required.');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email must be a valid email address.');
  }

  if (data.phone && !/^\d{10}$/.test(data.phone)) {
    errors.push('phone must be a 10-digit number.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};
