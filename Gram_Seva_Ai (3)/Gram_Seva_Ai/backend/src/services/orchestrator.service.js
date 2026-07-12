/**
 * Orchestrator Service — proxies to the teammate's Python FastAPI
 * orchestrator, which owns voice/text intent classification, grievances,
 * and ID-update requests (not part of this Node app's Prisma schema).
 * See /shared/CONTRACT.md §1 for the API contract this follows.
 *
 * This is the entry point for the WhatsApp -> n8n -> Firebase -> Postgres
 * pipeline: n8n writes a `handleMessage` request (see actionRouter.js) to
 * the gram_seva_requests collection with the inbound WhatsApp text; this
 * service forwards it to POST /orchestrate, which classifies intent and
 * persists a grievance/ID-request as appropriate.
 */

const config = require('../config/env');
const logger = require('../config/logger');

const REQUEST_TIMEOUT_MS = 15000;

const baseUrl = () => (config.pythonOrchestratorUrl || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * POST /orchestrate on the Python service.
 *
 * @param {object} payload - { transcript, language, channel, citizenId|citizen_id }
 * @returns {Promise<object>} the orchestrator's classification + routing result
 */
const orchestrateMessage = async (payload = {}) => {
  const body = {
    transcript: payload.transcript ?? payload.text ?? payload.message,
    language: payload.language || 'en',
    channel: payload.channel || 'whatsapp',
    citizen_id: payload.citizenId ?? payload.citizen_id ?? payload.phone ?? null,
  };

  if (!body.transcript) {
    const err = new Error('transcript (or text/message) is required to orchestrate a message.');
    err.statusCode = 400;
    throw err;
  }

  const url = `${baseUrl()}/orchestrate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(`Orchestrator responded ${response.status}: ${text.slice(0, 300)}`);
      err.statusCode = 502;
      throw err;
    }

    return await response.json();
  } catch (err) {
    if (err.statusCode) throw err;
    logger.error('Failed to reach the Python orchestrator', { url, error: err.message });
    const wrapped = new Error(`Unable to reach orchestrator service: ${err.message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

module.exports = { orchestrateMessage };
