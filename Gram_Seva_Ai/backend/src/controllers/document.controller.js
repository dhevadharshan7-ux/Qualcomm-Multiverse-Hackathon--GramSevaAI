/**
 * Document Controller — handles HTTP requests for /api/documents.
 * Supports both multipart file uploads and URL-based document registration.
 */

const fs = require('fs');
const documentService = require('../services/document.service');
const res_utils = require('../helpers/response');

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

exports.getAll = async (req, res) => {
  const data = await documentService.getAllDocuments();
  const baseUrl = getBaseUrl(req);
  return res.json(
    res_utils.success('Documents fetched successfully', data.map((d) => documentService.toPublicDocument(d, baseUrl)))
  );
};

exports.getById = async (req, res) => {
  const data = await documentService.getDocumentById(req.params.id);
  if (!data) return res.status(404).json(res_utils.error('Document not found'));
  return res.json(res_utils.success('Document fetched successfully', documentService.toPublicDocument(data, getBaseUrl(req))));
};

exports.getByCitizen = async (req, res) => {
  const data = await documentService.getDocumentsByCitizen(req.params.citizenId);
  const baseUrl = getBaseUrl(req);
  return res.json(
    res_utils.success(
      'Documents for citizen fetched successfully',
      data.map((d) => documentService.toPublicDocument(d, baseUrl))
    )
  );
};

/**
 * POST /api/documents/upload — multipart/form-data upload via multer.
 * Requires: citizenId (body), documentType (body), file (multipart).
 * Deliberately unauthenticated — document upload is part of citizen intake
 * (see document.routes.js).
 */
exports.upload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json(res_utils.error('No file uploaded. Use multipart/form-data with field "file".'));
  }
  if (!req.body.citizenId || !req.body.documentType) {
    return res.status(400).json(res_utils.error('citizenId and documentType are required.'));
  }

  const baseUrl = getBaseUrl(req);
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

/**
 * GET /api/documents/:id/file — authenticated file download.
 *
 * Replaces the old public `express.static('/uploads', ...)` mount. Documents
 * hold sensitive citizen proof paperwork (Aadhaar images, income/caste
 * certificates), and citizens have no login concept in this platform, so
 * there's no "owning citizen" session to check against — this route is
 * gated to authenticated officers only (see document.routes.js). Citizens
 * upload documents through the open POST routes but do not re-download them
 * through this API.
 *
 * For documents registered via an external URL (not a local upload), this
 * redirects to that URL rather than trying to stream a file we don't have.
 */
exports.downloadFile = async (req, res) => {
  const doc = await documentService.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json(res_utils.error('Document not found'));

  const localPath = documentService.resolveLocalFilePath(doc.fileUrl);

  if (!localPath) {
    // Externally-registered document — not stored on our disk.
    return res.redirect(doc.fileUrl);
  }

  if (!fs.existsSync(localPath)) {
    return res.status(404).json(res_utils.error('File not found on disk'));
  }

  return res.sendFile(localPath);
};
