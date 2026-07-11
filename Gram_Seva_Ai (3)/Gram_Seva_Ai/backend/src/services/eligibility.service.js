/**
 * Eligibility Service — the core eligibility engine.
 *
 * Compares a citizen's profile against all EligibilityRules for a scheme
 * and returns a structured result with pass/fail details.
 *
 * AI NEVER calls this directly — it goes through tools.service.js.
 */

const eligibilityRepo = require('../repositories/eligibility.repository');
const citizenRepo = require('../repositories/citizen.repository');
const schemeRepo = require('../repositories/scheme.repository');
const { parseIntId } = require('../helpers/index');

// ─── CRUD for EligibilityRule model ─────────────────────────────────────────

const getAllRules = async () => eligibilityRepo.findAll();

const getRuleById = async (id) => eligibilityRepo.findById(parseIntId(id));

const getRulesByScheme = async (schemeId) => eligibilityRepo.findBySchemeId(parseIntId(schemeId));

const createRule = async (data) => {
  return eligibilityRepo.create({
    schemeId: parseIntId(data.schemeId),
    minAge: data.minAge ? parseInt(data.minAge, 10) : null,
    maxAge: data.maxAge ? parseInt(data.maxAge, 10) : null,
    maxIncome: data.maxIncome ? parseFloat(data.maxIncome) : null,
    occupation: data.occupation || null,
    caste: data.caste || null,
    gender: data.gender || null,
  });
};

const updateRule = async (id, data) => {
  return eligibilityRepo.update(parseIntId(id), data);
};

const deleteRule = async (id) => {
  return eligibilityRepo.remove(parseIntId(id));
};

// ─── Core Eligibility Engine ─────────────────────────────────────────────────

/**
 * Check if a citizen is eligible for a scheme.
 *
 * @param {number|string} citizenId
 * @param {number|string} schemeId
 * @returns {Promise<{
 *   eligible: boolean,
 *   citizen: object,
 *   scheme: object,
 *   rules: object[],
 *   failedRules: string[],
 *   passedRules: string[]
 * }>}
 */
const checkEligibility = async (citizenId, schemeId) => {
  const cId = parseIntId(citizenId);
  const sId = parseIntId(schemeId);

  const [citizen, scheme, rules] = await Promise.all([
    citizenRepo.findById(cId),
    schemeRepo.findById(sId),
    eligibilityRepo.findBySchemeId(sId),
  ]);

  if (!citizen) {
    const err = new Error(`Citizen #${cId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  if (!scheme) {
    const err = new Error(`Scheme #${sId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  // If no rules defined, everyone is eligible
  if (!rules || rules.length === 0) {
    return {
      eligible: true,
      citizen,
      scheme,
      rules: [],
      failedRules: [],
      passedRules: ['No restrictions — open to all eligible applicants.'],
    };
  }

  const failedRules = [];
  const passedRules = [];

  for (const rule of rules) {
    // Age: min
    if (rule.minAge !== null && citizen.age < rule.minAge) {
      failedRules.push(`Age must be at least ${rule.minAge} years (yours: ${citizen.age}).`);
    } else if (rule.minAge !== null) {
      passedRules.push(`Age ≥ ${rule.minAge} ✅`);
    }

    // Age: max
    if (rule.maxAge !== null && citizen.age > rule.maxAge) {
      failedRules.push(`Age must be at most ${rule.maxAge} years (yours: ${citizen.age}).`);
    } else if (rule.maxAge !== null) {
      passedRules.push(`Age ≤ ${rule.maxAge} ✅`);
    }

    // Income
    if (rule.maxIncome !== null && citizen.annualIncome > rule.maxIncome) {
      failedRules.push(
        `Annual income must be ≤ ₹${rule.maxIncome} (yours: ₹${citizen.annualIncome}).`
      );
    } else if (rule.maxIncome !== null) {
      passedRules.push(`Income ≤ ₹${rule.maxIncome} ✅`);
    }

    // Occupation
    if (
      rule.occupation !== null &&
      citizen.occupation.toLowerCase() !== rule.occupation.toLowerCase()
    ) {
      failedRules.push(
        `Occupation must be "${rule.occupation}" (yours: "${citizen.occupation}").`
      );
    } else if (rule.occupation !== null) {
      passedRules.push(`Occupation: ${rule.occupation} ✅`);
    }

    // Caste
    if (
      rule.caste !== null &&
      (citizen.caste || '').toLowerCase() !== rule.caste.toLowerCase()
    ) {
      failedRules.push(`Caste must be "${rule.caste}" (yours: "${citizen.caste || 'Not specified'}").`);
    } else if (rule.caste !== null) {
      passedRules.push(`Caste: ${rule.caste} ✅`);
    }

    // Gender
    if (rule.gender !== null && citizen.gender !== rule.gender) {
      failedRules.push(`Gender must be ${rule.gender} (yours: ${citizen.gender}).`);
    } else if (rule.gender !== null) {
      passedRules.push(`Gender: ${rule.gender} ✅`);
    }
  }

  return {
    eligible: failedRules.length === 0,
    citizen,
    scheme,
    rules,
    failedRules,
    passedRules,
  };
};

module.exports = {
  getAllRules,
  getRuleById,
  getRulesByScheme,
  createRule,
  updateRule,
  deleteRule,
  checkEligibility,
};