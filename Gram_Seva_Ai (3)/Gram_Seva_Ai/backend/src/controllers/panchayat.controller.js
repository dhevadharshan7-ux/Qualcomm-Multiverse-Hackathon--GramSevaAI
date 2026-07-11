/**
 * Panchayat Controller — handles HTTP requests for /api/panchayats.
 */

const panchayatService = require('../services/panchayat.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const data = await panchayatService.getAllPanchayats();
  return res.json(res_utils.success('Panchayats fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await panchayatService.getPanchayatById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Panchayat not found'));
  return res.json(res_utils.success('Panchayat fetched successfully', data));
};

exports.getByDistrict = async (req, res) => {
  const { district } = req.query;
  if (!district) return res.status(400).json(res_utils.error('Query param "district" is required'));
  const data = await panchayatService.getPanchayatsByDistrict(district);
  return res.json(res_utils.success('Panchayats for district fetched successfully', data));
};

exports.create = async (req, res) => {
  const data = await panchayatService.createPanchayat(req.body);
  return res.status(201).json(res_utils.success('Panchayat created successfully', data));
};

exports.update = async (req, res) => {
  const data = await panchayatService.updatePanchayat(req.params.id, req.body);
  return res.json(res_utils.success('Panchayat updated successfully', data));
};

exports.delete = async (req, res) => {
  await panchayatService.deletePanchayat(req.params.id);
  return res.json(res_utils.success('Panchayat deleted successfully', null));
};