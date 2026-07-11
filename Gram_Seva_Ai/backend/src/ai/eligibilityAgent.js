/**
 * Eligibility Agent — AI-enhanced eligibility explanation.
 * Delegates core engine logic to eligibility.service.js.
 * Generates human-readable explanations via AI.
 */

const eligibilityService = require('../services/eligibility.service');
const aiService = require('../services/ai.service');
const { buildEligibilityExplanationPrompt } = require('./prompt.service');
const logger = require('../config/logger');

/**
 * Check eligibility and generate an AI explanation.
 *
 * @param {number} citizenId
 * @param {number} schemeId
 * @returns {Promise<{ result: object, explanation: string }>}
 */
const checkWithExplanation = async (citizenId, schemeId) => {
  const result = await eligibilityService.checkEligibility(citizenId, schemeId);

  let explanation = '';
  try {
    const prompt = buildEligibilityExplanationPrompt(
      result.citizen,
      result.scheme,
      result.rules,
      result
    );
    const { response } = await aiService.chat(prompt, { model: 'claude' });
    explanation = response;
  } catch (err) {
    logger.warn('Could not generate AI explanation for eligibility result', { error: err.message });
    explanation = result.eligible
      ? `You are eligible for ${result.scheme.schemeName}.`
      : `You are not eligible for ${result.scheme.schemeName}. Reasons: ${result.failedRules.join('; ')}`;
  }

  return { result, explanation };
};

module.exports = { checkWithExplanation };