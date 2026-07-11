/**
 * Scheme Controller — handles HTTP requests for /api/schemes.
 */

const schemeService = require('../services/scheme.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const includeRules = req.query.includeRules === 'true';
  const data = await schemeService.getAllSchemes({ includeRules });
  return res.json(res_utils.success('Schemes fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await schemeService.getSchemeById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Scheme not found'));
  return res.json(res_utils.success('Scheme fetched successfully', data));
};

exports.search = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json(res_utils.error('Query param "q" is required'));
  const data = await schemeService.searchSchemes(q);
  return res.json(res_utils.success('Schemes search results', data));
};

exports.create = async (req, res) => {
  const data = await schemeService.createScheme(req.body);
  return res.status(201).json(res_utils.success('Scheme created successfully', data));
};

exports.update = async (req, res) => {
  const data = await schemeService.updateScheme(req.params.id, req.body);
  return res.json(res_utils.success('Scheme updated successfully', data));
};

exports.delete = async (req, res) => {
  await schemeService.deleteScheme(req.params.id);
  return res.json(res_utils.success('Scheme deleted successfully', null));
};