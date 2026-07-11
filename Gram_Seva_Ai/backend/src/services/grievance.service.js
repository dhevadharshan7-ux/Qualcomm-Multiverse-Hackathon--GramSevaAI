/**
 * Grievance Service — bridges Gram Seva AI to the teammate's Python FastAPI
 * "Grievance Platform" (part of the orchestrator service), which owns
 * grievance persistence (the `grievances` table) in the shared Postgres
 * instance. See /shared/CONTRACT.md §4 for the API contract this follows.
 *
 * Unlike every other service in this project, this one does NOT touch
 * Prisma — grievances aren't part of this project's schema. It only proxies
 * HTTP calls to the Python service.
 */

const config = require('../config/env');
const logger = require('../config/logger');

const REQUEST_TIMEOUT_MS = 8000;

const baseUrl = () => config.pythonOrchestratorUrl.replace(/\/+$/, '');

/**
 * POST /grievances on the Python Grievance Platform.
 *
 * @param {object} payload - new_grievance shape (camelCase or snake_case
 *   accepted): citizenId/citizen_id, category, description, location,
 *   priority, sourceChannel/source_channel.
 * @returns {Promise<object>} the created grievance record (per CONTRACT.md §4)
 */
const raiseComplaint = async (payload = {}) => {
  const body = {
    citizen_id: payload.citizenId ?? payload.citizen_id ?? null,
    category: payload.category,
    description: payload.description,
    location: payload.location ?? null,
    priority: payload.priority || 'low',
    source_channel: payload.sourceChannel || payload.source_channel || 'form',
  };

  if (!body.category || !body.description) {
    const err = new Error('category and description are required to raise a complaint.');
    err.statusCode = 400;
    throw err;
  }

  const url = `${baseUrl()}/grievances`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(`Grievance service responded ${response.status}: ${text.slice(0, 300)}`);
      err.statusCode = 502;
      throw err;
    }

    return await response.json();
  } catch (err) {
    if (err.statusCode) throw err;
    logger.error('Failed to raise complaint via Python Grievance Platform', {
      url,
      error: err.message,
    });
    const wrapped = new Error(`Unable to reach grievance service: ${err.message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

/**
 * GET /grievances/{id} on the Python Grievance Platform.
 *
 * NOTE: the Python service only supports single-id lookup — there is no
 * "list all grievances" endpoint. `listComplaints` here is therefore a
 * single-id lookup by another name (kept for parity with the requestRouter
 * action name). Callers must supply a grievanceId; if they don't, we throw
 * a 400 rather than silently returning an empty/wrong list.
 *
 * @param {object} payload - must include grievanceId (or grievance_id/id)
 * @returns {Promise<object>} the grievance record (per CONTRACT.md §4)
 */
const listComplaints = async (payload = {}) => {
  const grievanceId = payload.grievanceId || payload.grievance_id || payload.id;

  if (!grievanceId) {
    const err = new Error(
      'grievanceId is required — the Python Grievance Platform only supports lookup by id, not listing all grievances.'
    );
    err.statusCode = 400;
    throw err;
  }

  const url = `${baseUrl()}/grievances/${encodeURIComponent(grievanceId)}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (response.status === 404) {
      const err = new Error('Grievance not found');
      err.statusCode = 404;
      throw err;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(`Grievance service responded ${response.status}: ${text.slice(0, 300)}`);
      err.statusCode = 502;
      throw err;
    }

    return await response.json();
  } catch (err) {
    if (err.statusCode) throw err;
    logger.error('Failed to fetch complaint from Python Grievance Platform', {
      url,
      error: err.message,
    });
    const wrapped = new Error(`Unable to reach grievance service: ${err.message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

module.exports = { raiseComplaint, listComplaints };
