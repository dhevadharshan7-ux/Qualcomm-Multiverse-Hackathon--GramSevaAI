/**
 * Citizen Controller — handles HTTP requests for /api/citizens.
 */

const citizenService = require('../services/citizen.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const data = await citizenService.getAllCitizens();
  return res.json(res_utils.success('Citizens fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await citizenService.getCitizenById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Citizen not found'));
  return res.json(res_utils.success('Citizen fetched successfully', data));
};

exports.getByAadhaar = async (req, res) => {
  const data = await citizenService.getCitizenByAadhaar(req.params.aadhaar);
  if (!data) return res.status(404).json(res_utils.error('Citizen not found with this Aadhaar'));
  return res.json(res_utils.success('Citizen fetched successfully', data));
};

exports.create = async (req, res) => {
  const data = await citizenService.createCitizen(req.body);
  return res.status(201).json(res_utils.success('Citizen created successfully', data));
};

exports.update = async (req, res) => {
  const data = await citizenService.updateCitizen(req.params.id, req.body);
  return res.json(res_utils.success('Citizen updated successfully', data));
};

exports.delete = async (req, res) => {
  await citizenService.deleteCitizen(req.params.id);
  return res.json(res_utils.success('Citizen deleted successfully', null));
};