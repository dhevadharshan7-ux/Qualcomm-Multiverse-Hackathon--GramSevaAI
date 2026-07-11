/**
 * Application MCP Tools — wraps applyScheme and trackApplication tools.
 */

const { applyScheme, trackApplication, checkEligibility } = require('../ai/tools.service');

module.exports = {
  checkEligibility: async (input) => checkEligibility(input.citizenId, input.schemeId),
  applyScheme: async (input) => applyScheme(input.citizenId, input.schemeId),
  trackApplication: async (input) => trackApplication(input.applicationId),
};