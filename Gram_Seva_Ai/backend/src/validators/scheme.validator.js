/**
 * Scheme Validator — validates request body for creating/updating a scheme.
 *
 * benefit/department/schemeUrl are optional: the bulk-imported central-gov
 * catalog (prisma/data/schemes.csv) only has schemeName/description/
 * schemeUrl — see prisma/schema.prisma's Scheme model comment.
 */

exports.schemeSchema = (data) => {
  const errors = [];

  if (!data.schemeName || data.schemeName.trim() === '') {
    errors.push('schemeName is required.');
  }

  if (!data.description || data.description.trim() === '') {
    errors.push('description is required.');
  }

  return errors.length > 0 ? { error: errors.join(' ') } : { error: null };
};