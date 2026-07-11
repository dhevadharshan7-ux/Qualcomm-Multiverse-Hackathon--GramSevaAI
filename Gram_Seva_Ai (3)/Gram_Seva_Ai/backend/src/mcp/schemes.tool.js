/**
 * Scheme MCP Tool — wraps findScheme tool.
 */

const { findScheme } = require('../ai/tools.service');

module.exports = {
  findScheme: async (input) => findScheme(input.query),
};