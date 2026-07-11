/**
 * Conversation Agent — Multi-turn AI conversation handler.
 * Delegates to claude.service or gemini.service via ai.service.js.
 */

const aiService = require('../services/ai.service');

/**
 * Process a conversation message.
 * @param {string} message - User message
 * @param {object} options - { model, sessionId }
 */
const processMessage = async (message, options = {}) => {
  return aiService.chat(message, options);
};

module.exports = { processMessage };