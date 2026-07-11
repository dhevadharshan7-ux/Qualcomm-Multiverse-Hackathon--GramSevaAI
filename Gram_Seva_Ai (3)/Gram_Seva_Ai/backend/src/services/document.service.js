/**
 * Document Service — business logic for citizen document management.
 * Supports both file-upload (multer local disk) and external URL storage.
 */

const documentRepo = require('../repositories/document.repository');
const { parseIntId } = require('../helpers/index');
const path = require('path');
const config = require('../config/env');

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
 * Converts the local file path to a server-accessible URL.
 *
 * @param {number} citizenId
 * @param {string} documentType
 * @param {object} file - The multer file object
 * @param {string} baseUrl - e.g. 'http://localhost:3000'
 */
const createDocumentFromUpload = async (citizenId, documentType, file, baseUrl) => {
  const relativePath = file.path.replace(/\\/g, '/');
  const fileUrl = `${baseUrl}/${relativePath}`;

  return documentRepo.create({
    citizenId: parseIntId(citizenId),
    documentType,
    fileUrl,
  });
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
};