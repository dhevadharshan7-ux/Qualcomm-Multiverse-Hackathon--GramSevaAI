/**
 * AuditLog Service — logs all significant system events.
 * Used by controllers, services, and AI tools to create an audit trail.
 */

const auditlogRepo = require('../repositories/auditlog.repository');

/**
 * Write an audit log entry.
 *
 * @param {string} action - What happened (e.g., 'CREATE_CITIZEN', 'APPROVE_APPLICATION')
 * @param {string} actor - Who did it (e.g., 'SYSTEM', 'OFFICER_3', 'AI_AGENT', 'CITIZEN_5')
 * @param {string} [entity] - Entity type (e.g., 'Citizen', 'Application')
 * @param {number} [entityId] - Primary key of the affected record
 * @param {string} [details] - Human-readable description
 */
const log = async (action, actor, entity, entityId, details) => {
  return auditlogRepo.create({
    action,
    actor: String(actor),
    entity: entity || null,
    entityId: entityId ? parseInt(entityId, 10) : null,
    details: details ? String(details).slice(0, 500) : null, // cap at 500 chars
  });
};

const getAllLogs = async (limit) => auditlogRepo.findAll({ limit });

const getLogsByEntity = async (entity, entityId) => auditlogRepo.findByEntity(entity, entityId);

const getLogsByActor = async (actor) => auditlogRepo.findByActor(actor);

module.exports = { log, getAllLogs, getLogsByEntity, getLogsByActor };
