/**
 * AISession Repository — database access layer for the AISession model.
 * Every AI interaction is persisted for audit, replay, and analytics.
 */

const prisma = require('../config/prisma');

/**
 * Persist an AI session record.
 * @param {object} data - { sessionId, model, prompt, response }
 */
const create = async (data) => {
  return prisma.aISession.create({ data });
};

const findAll = async ({ limit = 50 } = {}) => {
  return prisma.aISession.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

/**
 * Retrieve a session by its unique sessionId string.
 */
const findBySessionId = async (sessionId) => {
  return prisma.aISession.findUnique({ where: { sessionId } });
};

module.exports = { create, findAll, findBySessionId };
