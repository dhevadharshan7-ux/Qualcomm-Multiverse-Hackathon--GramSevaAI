/**
 * AuditLog Repository — database access layer for the AuditLog model.
 * Write-heavy; reads are for admin dashboards.
 */

const prisma = require('../config/prisma');

/**
 * Create an audit log entry.
 * @param {object} data - { action, actor, entity?, entityId?, details? }
 */
const create = async (data) => {
  return prisma.auditLog.create({ data });
};

const findAll = async ({ limit = 50 } = {}) => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

/**
 * Find all audit logs related to a specific entity type and optional ID.
 */
const findByEntity = async (entity, entityId) => {
  const where = { entity };
  if (entityId !== undefined) where.entityId = entityId;
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

/**
 * Find all logs created by a specific actor (user/system).
 */
const findByActor = async (actor) => {
  return prisma.auditLog.findMany({
    where: { actor: { contains: actor, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

module.exports = { create, findAll, findByEntity, findByActor };
