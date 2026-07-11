/**
 * Anthropic Claude client configuration.
 * Uses @anthropic-ai/sdk. Falls back gracefully if API key is not set.
 *
 * Usage:
 *   const { getClaudeClient, isClaudeAvailable } = require('./vertex');
 */

const config = require('./env');
const logger = require('../config/logger');

let _client = null;

/**
 * Returns true if the Claude API key is configured.
 */
const isClaudeAvailable = () => Boolean(config.anthropicApiKey);

/**
 * Lazily initialises and returns the Anthropic client.
 * Returns null if no API key is configured (graceful degradation).
 */
const getClaudeClient = () => {
  if (!isClaudeAvailable()) {
    logger.warn('Claude (Anthropic) API key not configured. AI features will be unavailable.');
    return null;
  }

  if (!_client) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      _client = new Anthropic({ apiKey: config.anthropicApiKey });
      logger.info('Anthropic Claude client initialised successfully.');
    } catch (err) {
      logger.error('Failed to initialise Anthropic client.', { error: err.message });
      return null;
    }
  }

  return _client;
};

module.exports = {
  getClaudeClient,
  isClaudeAvailable,
  defaultModel: 'claude-sonnet-4-6',
  maxTokens: 4096,
};
