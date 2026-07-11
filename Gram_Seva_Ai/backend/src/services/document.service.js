/**
 * Document Service — business logic for citizen document management.
 * Supports both file-upload (multer local disk) and external URL storage.
 */

const documentRepo = require('../repositories/document.repository');
const { parseIntId } = require('../helpers/index');
const path = require('path');
const config = require('../config/env');

const isExternalUrl = (fileUrl) => typeof fileUrl === 'string' && /^https?:\/\//i.test(fileUrl);

/**
 * Rewrite a document's fileUrl for API responses so clients never see (or
 * need) the old public /uploads static path — locally-stored uploads are now
 * only reachable via the authenticated GET /api/documents/:id/file route.
 * Externally-registered fileUrls (from the URL-registration flow) are left
 * untouched since they don't live on our disk.
 */
const toPublicDocument = (doc, baseUrl) => {
  if (!doc) return doc;
  if (isExternalUrl(doc.fileUrl)) return doc;
  return { ...doc, fileUrl: `${baseUrl}/api/documents/${doc.id}/file` };
};

/**
 * Resolve a document's fileUrl to an absolute on-disk path, if it refers to
 * a locally-stored upload. Returns null for external (http/https) URLs.
 */
const resolveLocalFilePath = (fileUrl) => {
  if (!fileUrl || isExternalUrl(fileUrl)) return null;
  return path.resolve(process.cwd(), fileUrl);
};

const getAllDocuments = async () => {
  return documentRepo.findAll();
};

const getDocumentById = async (id) => {
  return documentRepo.findById(parseIntId(id));
};

const getDocumentsByCitizen = async (citizenId) => {
  return documentRepo.findByCitizenId(parseIntId(citizenId));
};

const getDocumentsByType = async (citizenId, documentType) => {
  return documentRepo.findByType(parseIntId(citizenId), documentType);
};

/**
 * Create a document record from a URL (external storage or pre-uploaded).
 */
const createDocument = async (data) => {
  return documentRepo.create({
    citizenId: parseIntId(data.citizenId),
    documentType: data.documentType,
    fileUrl: data.fileUrl,
  });
};

/**
 * Create a document record from a multer upload result.
 *
 * Stores the local on-disk relative path as fileUrl — NOT a public URL.
 * There is no longer a static file mount; callers must use
 * toPublicDocument()/the GET /api/documents/:id/file route to get a
 * fetchable link (see document.controller.js).
 *
 * @param {number} citizenId
 * @param {string} documentType
 * @param {object} file - The multer file object
 * @param {string} baseUrl - e.g. 'http://localhost:3000' (kept for API compatibility with callers)
 */
const createDocumentFromUpload = async (citizenId, documentType, file, baseUrl) => {
  const relativePath = file.path.replace(/\\/g, '/');

  const doc = await documentRepo.create({
    citizenId: parseIntId(citizenId),
    documentType,
    fileUrl: relativePath,
  });

  return toPublicDocument(doc, baseUrl);
};

const deleteDocument = async (id) => {
  return documentRepo.remove(parseIntId(id));
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  getDocumentsByCitizen,
  getDocumentsByType,
  createDocument,
  createDocumentFromUpload,
  deleteDocument,
  toPublicDocument,
  resolveLocalFilePath,
};