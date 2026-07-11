/**
 * AI Tools Service — the 9 tools exposed to the AI layer and MCP server.
 *
 * ARCHITECTURE CONTRACT:
 *   AI → tools.service.js → application services → repositories → Prisma → PostgreSQL
 *
 * AI NEVER touches Prisma directly. All DB access flows through services.
 * These tools are pure orchestration — they call services, never repositories.
 */

const citizenService = require('../services/citizen.service');
const schemeService = require('../services/scheme.service');
const applicationService = require('../services/application.service');
const eligibilityService = require('../services/eligibility.service');
const documentService = require('../services/document.service');
const auditlogService = require('../services/auditlog.service');
const logger = require('../config/logger');

// ─── Tool: Register Citizen ──────────────────────────────────────────────────

/**
 * Register a new citizen in the system.
 * @param {object} data - { aadhaar, fullName, age, gender, phone, occupation, annualIncome, caste, address, villageId }
 */
const registerCitizen = async (data) => {
  logger.info('[AI Tool] registerCitizen called', { aadhaar: data.aadhaar });
  const citizen = await citizenService.createCitizen(data);
  await auditlogService.log('REGISTER_CITIZEN', 'AI_AGENT', 'Citizen', citizen.id, `Registered ${citizen.fullName}`);
  return { success: true, data: citizen };
};

// ─── Tool: Find Citizen ──────────────────────────────────────────────────────

/**
 * Find a citizen by Aadhaar number.
 * @param {string} aadhaar - 12-digit Aadhaar
 */
const findCitizen = async (aadhaar) => {
  logger.info('[AI Tool] findCitizen called', { aadhaar });
  const citizen = await citizenService.getCitizenByAadhaar(aadhaar);
  if (!citizen) return { success: false, message: 'Citizen not found with this Aadhaar number.' };
  return { success: true, data: citizen };
};

// ─── Tool: Find Scheme ───────────────────────────────────────────────────────

/**
 * Find a government scheme by name or department.
 * @param {string} query - Scheme name or department keyword
 */
const findScheme = async (query) => {
  logger.info('[AI Tool] findScheme called', { query });
  const schemes = await schemeService.searchSchemes(query);
  if (!schemes || schemes.length === 0) {
    return { success: false, message: `No schemes found matching "${query}".` };
  }
  return { success: true, data: schemes };
};

// ─── Tool: Check Eligibility ─────────────────────────────────────────────────

/**
 * Check if a citizen is eligible for a scheme.
 * @param {number} citizenId
 * @param {number} schemeId
 */
const checkEligibility = async (citizenId, schemeId) => {
  logger.info('[AI Tool] checkEligibility called', { citizenId, schemeId });
  const result = await eligibilityService.checkEligibility(citizenId, schemeId);
  return { success: true, data: result };
};

// ─── Tool: Apply for Scheme ──────────────────────────────────────────────────

/**
 * Submit a scheme application for a citizen.
 * @param {number} citizenId
 * @param {number} schemeId
 */
const applyScheme = async (citizenId, schemeId) => {
  logger.info('[AI Tool] applyScheme called', { citizenId, schemeId });

  // Eligibility check before applying
  const eligibility = await eligibilityService.checkEligibility(citizenId, schemeId);
  if (!eligibility.eligible) {
    return {
      success: false,
      message: 'Citizen is not eligible for this scheme.',
      data: { failedRules: eligibility.failedRules },
    };
  }

  const application = await applicationService.createApplication({ citizenId, schemeId });
  await auditlogService.log('APPLY_SCHEME', 'AI_AGENT', 'Application', application.id, `Citizen ${citizenId} applied for scheme ${schemeId}`);
  return { success: true, data: application };
};

// ─── Tool: Track Application ─────────────────────────────────────────────────

/**
 * Track the status of a specific application.
 * @param {number} applicationId
 */
const trackApplication = async (applicationId) => {
  logger.info('[AI Tool] trackApplication called', { applicationId });
  const application = await applicationService.getApplicationById(applicationId);
  if (!application) {
    return { success: false, message: `Application #${applicationId} not found.` };
  }
  return { success: true, data: application };
};

// ─── Tool: Upload Document ───────────────────────────────────────────────────

/**
 * Record a document for a citizen (URL-based or post-upload).
 * @param {number} citizenId
 * @param {string} documentType
 * @param {string} fileUrl
 */
const uploadDocument = async (citizenId, documentType, fileUrl) => {
  logger.info('[AI Tool] uploadDocument called', { citizenId, documentType });
  const doc = await documentService.createDocument({ citizenId, documentType, fileUrl });
  await auditlogService.log('UPLOAD_DOCUMENT', 'AI_AGENT', 'Document', doc.id, `Type: ${documentType}`);
  return { success: true, data: doc };
};

// ─── Tool: Raise Complaint ───────────────────────────────────────────────────

/**
 * Log a citizen complaint as an audit record.
 * @param {number} citizenId
 * @param {string} details - Complaint description
 */
const raiseComplaint = async (citizenId, details) => {
  logger.info('[AI Tool] raiseComplaint called', { citizenId });
  const log = await auditlogService.log(
    'RAISE_COMPLAINT',
    `CITIZEN_${citizenId}`,
    'Citizen',
    citizenId,
    details
  );
  return { success: true, message: 'Your complaint has been recorded.', data: log };
};

// ─── Tool: List Documents ────────────────────────────────────────────────────

/**
 * List all documents for a citizen.
 * @param {number} citizenId
 */
const listDocuments = async (citizenId) => {
  logger.info('[AI Tool] listDocuments called', { citizenId });
  const documents = await documentService.getDocumentsByCitizen(citizenId);
  return { success: true, data: documents };
};

// ─── Tool Registry ───────────────────────────────────────────────────────────

const TOOLS = {
  registerCitizen,
  findCitizen,
  findScheme,
  checkEligibility,
  applyScheme,
  trackApplication,
  uploadDocument,
  raiseComplaint,
  listDocuments,
};

module.exports = TOOLS;
