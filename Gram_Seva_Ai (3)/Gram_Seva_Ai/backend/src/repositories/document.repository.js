/**
 * Document Repository — database access layer for the Document model.
 * Supports both local disk uploads (via multer) and external URL storage.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.document.findMany({
    include: { citizen: { select: { id: true, fullName: true, aadhaar: true } } },
    orderBy: { uploadedAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.document.findUnique({
    where: { id },
    include: { citizen: { select: { id: true, fullName: true, aadhaar: true } } },
  });
};

const findByCitizenId = async (citizenId) => {
  return prisma.document.findMany({
    where: { citizenId },
    orderBy: { uploadedAt: 'desc' },
  });
};

const findByType = async (citizenId, documentType) => {
  return prisma.document.findMany({
    where: {
      citizenId,
      documentType: { contains: documentType, mode: 'insensitive' },
    },
    orderBy: { uploadedAt: 'desc' },
  });
};

const create = async (data) => {
  return prisma.document.create({
    data,
    include: { citizen: { select: { id: true, fullName: true } } },
  });
};

const remove = async (id) => {
  return prisma.document.delete({ where: { id } });
};

module.exports = { findAll, findById, findByCitizenId, findByType, create, remove };
