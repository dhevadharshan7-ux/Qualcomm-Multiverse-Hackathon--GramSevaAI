/**
 * Gemini Service — wraps Google Generative AI (Gemini) API calls.
 * AI NEVER accesses Prisma. Session persistence handled by ai.service.js.
 *
 * Falls back gracefully when GEMINI_API_KEY is not set.
 */

const config = require('../config/env');
const { SYSTEM_PROMPT } = require('./prompt.service');
const logger = require('../config/logger');

const GEMINI_MODEL = 'gemini-2.0-flash';

let _genAI = null;

const isGeminiAvailable = () => Boolean(config.geminiApiKey);

const getGeminiClient = () => {
  if (!isGeminiAvailable()) {
    logger.warn('Gemini API key not configured. Gemini features will be unavailable.');
    return null;
  }

  if (!_genAI) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      _genAI = new GoogleGenerativeAI(config.geminiApiKey);
      logger.info('Gemini client initialised successfully.');
    } catch (err) {
      logger.error('Failed to initialise Gemini client.', { error: err.message });
      return null;
    }
  }

  return _genAI;
};

/**
 * Send a prompt to Gemini and return the text response.
 *
 * @param {string} prompt - The user prompt
 * @param {string} [systemPrompt] - System instruction
 * @param {string} [model] - Model name override
 * @returns {Promise<string>} - Text response from Gemini
 */
const chat = async (prompt, systemPrompt = SYSTEM_PROMPT, model = GEMINI_MODEL) => {
  const genAI = getGeminiClient();

  if (!genAI) {
    return 'AI service is currently unavailable. Please contact your local Panchayat office for assistance.';
  }

  try {
    logger.info('Sending request to Gemini', { model, promptLength: prompt.length });

    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
    });

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    logger.info('Gemini response received', { model });

    return responseText;
  } catch (err) {
    logger.error('Gemini API call failed', { error: err.message });
    throw new Error(`Gemini AI error: ${err.message}`);
  }
};

/**
 * Gemini with conversation history (multi-turn).
 *
 * @param {Array<{role: string, parts: string}>} history - Previous conversation
 * @param {string} newMessage - Latest user message
 * @returns {Promise<string>} - Assistant's reply
 */
const chatWithHistory = async (history, newMessage) => {
  const genAI = getGeminiClient();

  if (!genAI) {
    return 'AI service is currently unavailable. Please contact your local Panchayat office for assistance.';
  }

  try {
    const geminiModel = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    const chatSession = geminiModel.startChat({ history });
    const result = await chatSession.sendMessage(newMessage);
    return result.response.text();
  } catch (err) {
    logger.error('Gemini chatWithHistory failed', { error: err.message });
    throw new Error(`Gemini AI error: ${err.message}`);
  }
};

module.exports = { chat, chatWithHistory, isGeminiAvailable };
