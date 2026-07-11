/**
 * Audit Controller — handles HTTP requests for /api/audit.
 */

const auditlogService = require('../services/auditlog.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const data = await auditlogService.getAllLogs(limit);
  return res.json(res_utils.success('Audit logs fetched successfully', data));
};

exports.getByEntity = async (req, res) => {
  const { entity, entityId } = req.query;
  if (!entity) return res.status(400).json(res_utils.error('"entity" query param is required'));
  const data = await auditlogService.getLogsByEntity(entity, entityId ? parseInt(entityId, 10) : undefined);
  return res.json(res_utils.success('Audit logs for entity fetched successfully', data));
};

exports.getByActor = async (req, res) => {
  const { actor } = req.query;
  if (!actor) return res.status(400).json(res_utils.error('"actor" query param is required'));
  const data = await auditlogService.getLogsByActor(actor);
  return res.json(res_utils.success('Audit logs for actor fetched successfully', data));
};