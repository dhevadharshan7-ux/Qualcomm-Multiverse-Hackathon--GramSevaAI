/**
 * Officer Controller — handles HTTP requests for /api/officers.
 */

const officerService = require('../services/officer.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const data = await officerService.getAllOfficers();
  return res.json(res_utils.success('Officers fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await officerService.getOfficerById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Officer not found'));
  return res.json(res_utils.success('Officer fetched successfully', data));
};

exports.getByPanchayat = async (req, res) => {
  const data = await officerService.getOfficersByPanchayat(req.params.panchayatId);
  return res.json(res_utils.success('Officers for panchayat fetched successfully', data));
};

exports.create = async (req, res) => {
  const data = await officerService.createOfficer(req.body);
  return res.status(201).json(res_utils.success('Officer created successfully', data));
};

exports.update = async (req, res) => {
  const data = await officerService.updateOfficer(req.params.id, req.body);
  return res.json(res_utils.success('Officer updated successfully', data));
};

exports.delete = async (req, res) => {
  await officerService.deleteOfficer(req.params.id);
  return res.json(res_utils.success('Officer deleted successfully', null));
};