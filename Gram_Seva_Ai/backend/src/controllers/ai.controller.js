/**
 * AI Controller — handles HTTP requests for /api/ai.
 * Routes all AI interactions through ai.service.js.
 * AI NEVER touches Prisma here.
 */

const aiService = require('../services/ai.service');
const aiTools = require('../ai/tools.service');
const res_utils = require('../helpers/response');

/**
 * POST /api/ai/chat
 * Body: { prompt, model?, sessionId? }
 */
exports.chat = async (req, res) => {
  const { prompt, model, sessionId } = req.body;

  const result = await aiService.chat(prompt, { model, sessionId });

  return res.json(
    res_utils.success('AI response generated', result)
  );
};

/**
 * GET /api/ai/sessions
 * List recent AI sessions.
 */
exports.listSessions = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const data = await aiService.listSessions(limit);
  return res.json(res_utils.success('AI sessions fetched successfully', data));
};

/**
 * GET /api/ai/sessions/:sessionId
 * Retrieve a specific AI session.
 */
exports.getSession = async (req, res) => {
  const data = await aiService.getSession(req.params.sessionId);
  if (!data) return res.status(404).json(res_utils.error('Session not found'));
  return res.json(res_utils.success('AI session fetched', data));
};

// ─── AI Tools Endpoints ──────────────────────────────────────────────────────
// These expose the AI tools directly via HTTP for testing and MCP integration.

/**
 * POST /api/ai/tools/eligibility
 * Body: { citizenId, schemeId }
 */
exports.toolCheckEligibility = async (req, res) => {
  const { citizenId, schemeId } = req.body;
  if (!citizenId || !schemeId) {
    return res.status(400).json(res_utils.error('citizenId and schemeId are required'));
  }
  const result = await aiTools.checkEligibility(citizenId, schemeId);
  return res.json(res_utils.success('Eligibility check complete', result));
};

/**
 * POST /api/ai/tools/apply
 * Body: { citizenId, schemeId }
 */
exports.toolApplyScheme = async (req, res) => {
  const { citizenId, schemeId } = req.body;
  if (!citizenId || !schemeId) {
    return res.status(400).json(res_utils.error('citizenId and schemeId are required'));
  }
  const result = await aiTools.applyScheme(citizenId, schemeId);
  return res.json(res_utils.success('Scheme application processed', result));
};

/**
 * GET /api/ai/tools/track/:applicationId
 */
exports.toolTrackApplication = async (req, res) => {
  const result = await aiTools.trackApplication(req.params.applicationId);
  return res.json(res_utils.success('Application tracked', result));
};