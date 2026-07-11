/**
 * Scheme Service — business logic for government schemes.
 * Controllers call this. This calls repositories. Never Prisma directly.
 */

const schemeRepo = require('../repositories/scheme.repository');

const getAllSchemes = async ({ includeRules = false } = {}) => {
  return schemeRepo.findAll({ includeRules });
};

const getSchemeById = async (id) => {
  return schemeRepo.findById(id);
};

const getSchemeByName = async (name) => {
  return schemeRepo.findByName(name);
};

/**
 * Search schemes by name or department keyword.
 * Used by the AI tool findScheme().
 */
const searchSchemes = async (query) => {
  // Try by department first, then supplement with name search
  const byDepartment = await schemeRepo.findByDepartment(query);
  const byName = await schemeRepo.findByName(query).catch(() => null);
  const combined = [...byDepartment];
  if (byName && !combined.find((s) => s.id === byName.id)) {
    combined.unshift(byName);
  }
  return combined;
};

const createScheme = async (data) => {
  return schemeRepo.create(data);
};

const updateScheme = async (id, data) => {
  return schemeRepo.update(id, data);
};

const deleteScheme = async (id) => {
  return schemeRepo.remove(id);
};

module.exports = {
  getAllSchemes,
  getSchemeById,
  getSchemeByName,
  searchSchemes,
  createScheme,
  updateScheme,
  deleteScheme,
};