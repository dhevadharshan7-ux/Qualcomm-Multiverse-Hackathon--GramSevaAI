/**
 * Claude Service — wraps Anthropic Claude API calls.
 * AI NEVER accesses Prisma. Session persistence is handled by ai.service.js.
 *
 * Falls back gracefully when ANTHROPIC_API_KEY is not set.
 */

const { getClaudeClient, defaultModel, maxTokens } = require('../config/vertex');
const { SYSTEM_PROMPT } = require('./prompt.service');
const logger = require('../config/logger');

/**
 * Send a prompt to Claude and return the text response.
 *
 * @param {string} prompt - The user prompt
 * @param {string} [systemPrompt] - Override the default system prompt
 * @param {string} [model] - Override the default model
 * @returns {Promise<string>} - The text response from Claude
 */
const chat = async (prompt, systemPrompt = SYSTEM_PROMPT, model = defaultModel) => {
  const client = getClaudeClient();

  if (!client) {
    logger.warn('Claude client unavailable. Returning fallback response.');
    return 'AI service is currently unavailable. Please contact your local Panchayat office for assistance.';
  }

  try {
    logger.info('Sending request to Claude', { model, promptLength: prompt.length });

    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    logger.info('Claude response received', {
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    return responseText;
  } catch (err) {
    logger.error('Claude API call failed', { error: err.message });
    throw new Error(`Claude AI error: ${err.message}`);
  }
};

/**
 * Claude with conversation history for multi-turn conversations.
 *
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} [systemPrompt] - System prompt
 * @returns {Promise<string>} - The assistant's reply
 */
const chatWithHistory = async (messages, systemPrompt = SYSTEM_PROMPT) => {
  const client = getClaudeClient();

  if (!client) {
    return 'AI service is currently unavailable. Please contact your local Panchayat office for assistance.';
  }

  try {
    const message = await client.messages.create({
      model: defaultModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  } catch (err) {
    logger.error('Claude chatWithHistory failed', { error: err.message });
    throw new Error(`Claude AI error: ${err.message}`);
  }
};

module.exports = { chat, chatWithHistory };
