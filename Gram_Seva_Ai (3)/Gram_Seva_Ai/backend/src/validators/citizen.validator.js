exports.citizenSchema = (data) => {
  const errors = [];
  if (!data.aadhaar || !/^\d{12}$/.test(data.aadhaar)) {
    errors.push('Aadhaar must be a 12-digit number.');
  }
  if (!data.fullName || data.fullName.trim() === '') {
    errors.push('FullName is required.');
  }
  if (!data.age || isNaN(data.age) || data.age <= 0) {
    errors.push('Valid age is required.');
  }
  if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
    errors.push('Gender must be MALE, FEMALE, or OTHER.');
  }
  if (data.phone && !/^\d{10}$/.test(data.phone)) {
    errors.push('Phone must be a 10-digit number.');
  }
  if (!data.occupation || data.occupation.trim() === '') {
    errors.push('Occupation is required.');
  }
  if (data.annualIncome === undefined || isNaN(data.annualIncome) || data.annualIncome < 0) {
    errors.push('Valid annualIncome is required.');
  }
  if (!data.villageId || isNaN(data.villageId)) {
    errors.push('Valid villageId is required.');
  }
  
  if (errors.length > 0) {
    return { error: errors.join(' ') };
  }
  return { error: null };
};