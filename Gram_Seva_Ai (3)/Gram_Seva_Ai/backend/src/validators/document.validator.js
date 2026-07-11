/**
 * Document Validator — validates the request body for creating a document record.
 * Used for both multipart uploads (multer) and external URL submissions.
 */

const VALID_DOCUMENT_TYPES = [
  'AADHAAR',
  'PAN',
  'INCOME_CERTIFICATE',
  'CASTE_CERTIFICATE',
  'RESIDENCE_PROOF',
  'BANK_PASSBOOK',
  'PHOTO',
  'OTHER',
];

exports.documentSchema = (data) => {
  const errors = [];

  if (!data.citizenId || isNaN(data.citizenId) || Number(data.citizenId) <= 0) {
    errors.push('Valid citizenId is required.');
  }

  if (!data.documentType || data.documentType.trim() === '') {
    errors.push('documentType is required.');
  }

  // Allow any string but warn if not a known type
  // fileUrl is optional here because it could come from multer (set after middleware)

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};

module.exports.VALID_DOCUMENT_TYPES = VALID_DOCUMENT_TYPES;
