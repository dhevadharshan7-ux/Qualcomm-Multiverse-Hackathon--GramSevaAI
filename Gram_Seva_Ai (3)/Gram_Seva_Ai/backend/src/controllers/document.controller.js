/**
 * Document Controller — handles HTTP requests for /api/documents.
 * Supports both multipart file uploads and URL-based document registration.
 */

const documentService = require('../services/document.service');
const res_utils = require('../helpers/response');
const config = require('../config/env');

exports.getAll = async (req, res) => {
  const data = await documentService.getAllDocuments();
  return res.json(res_utils.success('Documents fetched successfully', data));
};

exports.getById = async (req, res) => {
  const data = await documentService.getDocumentById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Document not found'));
  return res.json(res_utils.success('Document fetched successfully', data));
};

exports.getByCitizen = async (req, res) => {
  const data = await documentService.getDocumentsByCitizen(req.params.citizenId);
  return res.json(res_utils.success('Documents for citizen fetched successfully', data));
};

/**
 * POST /api/documents/upload — multipart/form-data upload via multer.
 * Requires: citizenId (body), documentType (body), file (multipart).
 */
exports.upload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json(res_utils.error('No file uploaded. Use multipart/form-data with field "file".'));
  }
  if (!req.body.citizenId || !req.body.documentType) {
    return res.status(400).json(res_utils.error('citizenId and documentType are required.'));
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const data = await documentService.createDocumentFromUpload(
    req.body.citizenId,
    req.body.documentType,
    req.file,
    baseUrl
  );
  return res.status(201).json(res_utils.success('Document uploaded successfully', data));
};

/**
 * POST /api/documents — register a document with an external URL.
 * Requires: citizenId, documentType, fileUrl (body JSON).
 */
exports.create = async (req, res) => {
  if (!req.body.fileUrl) {
    return res.status(400).json(res_utils.error('fileUrl is required.'));
  }
  const data = await documentService.createDocument(req.body);
  return res.status(201).json(res_utils.success('Document registered successfully', data));
};

exports.delete = async (req, res) => {
  await documentService.deleteDocument(req.params.id);
  return res.json(res_utils.success('Document deleted successfully', null));
};