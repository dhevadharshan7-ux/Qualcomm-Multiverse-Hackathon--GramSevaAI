/**
 * AI Service — orchestration layer for AI chat and tool invocation.
 *
 * ARCHITECTURE:
 *   Controller → ai.service.js → claude.service / gemini.service → AI API
 *                              → aisession.repository → Prisma (for persistence)
 *
 * AI NEVER accesses Prisma directly — this service is the only layer that does,
 * via the aisession repository.
 */

const claudeService = require('../ai/claude.service');
const geminiService = require('../ai/gemini.service');
const { SYSTEM_PROMPT } = require('../ai/prompt.service');
const aisessionRepo = require('../repositories/aisession.repository');
const { generateSessionId } = require('../helpers/index');
const logger = require('../config/logger');

const AI_MODELS = Object.freeze({ CLAUDE: 'claude', GEMINI: 'gemini' });

/**
 * Send a prompt to the AI, persist the session, and return the response.
 *
 * @param {string} prompt - User's message
 * @param {object} [options]
 * @param {string} [options.model='claude'] - 'claude' or 'gemini'
 * @param {string} [options.sessionId] - Existing session ID (optional)
 * @param {string} [options.systemPrompt] - Custom system prompt override
 * @returns {Promise<{ sessionId: string, model: string, response: string }>}
 */
const chat = async (prompt, { model = AI_MODELS.CLAUDE, sessionId, systemPrompt } = {}) => {
  const resolvedSessionId = sessionId || generateSessionId();
  const resolvedSystemPrompt = systemPrompt || SYSTEM_PROMPT;

  let response;
  let usedModel;

  try {
    if (model === AI_MODELS.GEMINI) {
      response = await geminiService.chat(prompt, resolvedSystemPrompt);
      usedModel = 'gemini-2.0-flash';
    } else {
      response = await claudeService.chat(prompt, resolvedSystemPrompt);
      usedModel = 'claude-sonnet-4-6';
    }
  } catch (err) {
    logger.error('AI service chat failed', { model, error: err.message });
    // Return a graceful fallback response
    response = 'I apologise, but I am unable to process your request right now. Please try again shortly or visit your local Panchayat office.';
    usedModel = model;
  }

  // Persist the session (fire and forget — don't fail the request if this fails)
  aisessionRepo.create({
    sessionId: resolvedSessionId,
    model: usedModel,
    prompt: prompt.slice(0, 2000), // cap to prevent DB overflow
    response: response.slice(0, 4000),
  }).catch((err) => logger.warn('Failed to persist AI session', { error: err.message }));

  return { sessionId: resolvedSessionId, model: usedModel, response };
};

/**
 * Retrieve a past AI session.
 */
const getSession = async (sessionId) => {
  return aisessionRepo.findBySessionId(sessionId);
};

/**
 * List recent AI sessions.
 */
const listSessions = async (limit = 20) => {
  return aisessionRepo.findAll({ limit });
};

module.exports = { chat, getSession, listSessions, AI_MODELS };