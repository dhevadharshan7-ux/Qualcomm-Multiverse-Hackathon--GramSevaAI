/**
 * Application Controller — handles HTTP requests for /api/applications.
 */

const applicationService = require('../services/application.service');
const res_utils = require('../helpers/response');

exports.getAll = async (req, res) => {
  const data = await applicationService.getAllApplications();
  return res.json(res_utils.success('Applications fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await applicationService.getApplicationById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Application not found'));
  return res.json(res_utils.success('Application fetched successfully', data));
};

exports.getByCitizen = async (req, res) => {
  const data = await applicationService.getApplicationsByCitizen(req.params.citizenId);
  return res.json(res_utils.success('Applications for citizen fetched successfully', data));
};

exports.getByScheme = async (req, res) => {
  const data = await applicationService.getApplicationsByScheme(req.params.schemeId);
  return res.json(res_utils.success('Applications for scheme fetched successfully', data));
};

exports.create = async (req, res) => {
  const data = await applicationService.createApplication(req.body);
  return res.status(201).json(res_utils.success('Application submitted successfully', data));
};

exports.updateStatus = async (req, res) => {
  const data = await applicationService.updateApplicationStatus(
    req.params.id,
    req.body.status,
    req.body.remarks
  );
  return res.json(res_utils.success('Application status updated', data));
};

exports.delete = async (req, res) => {
  await applicationService.deleteApplication(req.params.id);
  return res.json(res_utils.success('Application deleted successfully', null));
};