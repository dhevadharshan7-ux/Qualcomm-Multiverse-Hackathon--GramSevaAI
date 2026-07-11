/**
 * Eligibility Controller — handles HTTP requests for /api/eligibility.
 * Manages EligibilityRule CRUD and the core eligibility check.
 */

const eligibilityService = require('../services/eligibility.service');
const res_utils = require('../helpers/response');

// ─── EligibilityRule CRUD ────────────────────────────────────────────────────

exports.getAllRules = async (req, res) => {
  const data = await eligibilityService.getAllRules();
  return res.json(res_utils.success('Eligibility rules fetched successfully', data));
};

exports.getRuleById = async (req, res) => {
  const data = await eligibilityService.getRuleById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Eligibility rule not found'));
  return res.json(res_utils.success('Eligibility rule fetched successfully', data));
};

exports.getRulesByScheme = async (req, res) => {
  const data = await eligibilityService.getRulesByScheme(req.params.schemeId);
  return res.json(res_utils.success('Rules for scheme fetched successfully', data));
};

exports.createRule = async (req, res) => {
  const data = await eligibilityService.createRule(req.body);
  return res.status(201).json(res_utils.success('Eligibility rule created successfully', data));
};

exports.updateRule = async (req, res) => {
  const data = await eligibilityService.updateRule(req.params.id, req.body);
  return res.json(res_utils.success('Eligibility rule updated successfully', data));
};

exports.deleteRule = async (req, res) => {
  await eligibilityService.deleteRule(req.params.id);
  return res.json(res_utils.success('Eligibility rule deleted successfully', null));
};

// ─── Core Eligibility Check ──────────────────────────────────────────────────

/**
 * GET /api/eligibility/check?citizenId=X&schemeId=Y
 */
exports.check = async (req, res) => {
  const { citizenId, schemeId } = req.query;

  if (!citizenId || !schemeId) {
    return res.status(400).json(
      res_utils.error('Both "citizenId" and "schemeId" query params are required.')
    );
  }

  const result = await eligibilityService.checkEligibility(citizenId, schemeId);

  return res.json(
    res_utils.success(
      result.eligible
        ? `${result.citizen.fullName} is ELIGIBLE for ${result.scheme.schemeName}.`
        : `${result.citizen.fullName} is NOT eligible for ${result.scheme.schemeName}.`,
      result
    )
  );
};