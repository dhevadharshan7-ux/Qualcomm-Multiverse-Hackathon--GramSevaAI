/**
 * Application Service — business logic for citizen scheme applications.
 * Prevents duplicate applications, enforces eligibility checks (optional),
 * and manages status transitions.
 */

const applicationRepo = require('../repositories/application.repository');
const { parseIntId } = require('../helpers/index');

const getAllApplications = async () => {
  return applicationRepo.findAll();
};

const getApplicationById = async (id) => {
  return applicationRepo.findById(parseIntId(id));
};

const getApplicationsByCitizen = async (citizenId) => {
  return applicationRepo.findByCitizenId(parseIntId(citizenId));
};

const getApplicationsByScheme = async (schemeId) => {
  return applicationRepo.findBySchemeId(parseIntId(schemeId));
};

/**
 * Create a new application.
 * Guards against duplicate submissions (same citizen + same scheme).
 */
const createApplication = async (data) => {
  const citizenId = parseIntId(data.citizenId);
  const schemeId = parseIntId(data.schemeId);

  const duplicate = await applicationRepo.findDuplicate(citizenId, schemeId);
  if (duplicate) {
    const err = new Error('You have already applied for this scheme.');
    err.statusCode = 409;
    throw err;
  }

  return applicationRepo.create({ citizenId, schemeId, remarks: data.remarks || null });
};

/**
 * Update application status (for officers).
 */
const updateApplicationStatus = async (id, status, remarks) => {
  return applicationRepo.update(parseIntId(id), { status, remarks });
};

/**
 * Generic update (partial patch).
 */
const updateApplication = async (id, data) => {
  return applicationRepo.update(parseIntId(id), data);
};

const deleteApplication = async (id) => {
  return applicationRepo.remove(parseIntId(id));
};

module.exports = {
  getAllApplications,
  getApplicationById,
  getApplicationsByCitizen,
  getApplicationsByScheme,
  createApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
};