/**
 * Village Controller — handles HTTP requests for /api/villages.
 */

const villageService = require('../services/village.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const data = await villageService.getAllVillages();
  return res.json(res_utils.success('Villages fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await villageService.getVillageById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Village not found'));
  return res.json(res_utils.success('Village fetched successfully', data));
};

exports.getByPanchayat = async (req, res) => {
  const data = await villageService.getVillagesByPanchayat(req.params.panchayatId);
  return res.json(res_utils.success('Villages for panchayat fetched successfully', data));
};

exports.create = async (req, res) => {
  const data = await villageService.createVillage(req.body);
  return res.status(201).json(res_utils.success('Village created successfully', data));
};

exports.update = async (req, res) => {
  const data = await villageService.updateVillage(req.params.id, req.body);
  return res.json(res_utils.success('Village updated successfully', data));
};

exports.delete = async (req, res) => {
  await villageService.deleteVillage(req.params.id);
  return res.json(res_utils.success('Village deleted successfully', null));
};