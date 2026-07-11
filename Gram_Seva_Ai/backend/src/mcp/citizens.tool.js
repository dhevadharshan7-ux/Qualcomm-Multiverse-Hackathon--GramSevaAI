/**
 * Citizen MCP Tool — wraps registerCitizen and findCitizen tools.
 * Re-exports them with MCP-compatible calling conventions.
 */

const { registerCitizen, findCitizen } = require('../ai/tools.service');

module.exports = {
  registerCitizen: async (input) => registerCitizen(input),
  findCitizen: async (input) => findCitizen(input.aadhaar),
};