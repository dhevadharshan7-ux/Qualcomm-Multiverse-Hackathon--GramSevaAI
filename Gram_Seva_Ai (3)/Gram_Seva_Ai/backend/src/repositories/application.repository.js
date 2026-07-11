/**
 * Application Repository — database access layer for the Application model.
 * Only Prisma calls live here. No business logic.
 */

const prisma = require('../config/prisma');

const INCLUDE_RELATIONS = {
  citizen: { select: { id: true, fullName: true, aadhaar: true, phone: true } },
  scheme: { select: { id: true, schemeName: true, department: true, benefit: true } },
};

/**
 * Fetch all applications with citizen and scheme info.
 */
const findAll = async () => {
  return prisma.application.findMany({
    include: INCLUDE_RELATIONS,
    orderBy: { submittedAt: 'desc' },
  });
};

/**
 * Find a single application by ID.
 */
const findById = async (id) => {
  return prisma.application.findUnique({
    where: { id },
    include: INCLUDE_RELATIONS,
  });
};

/**
 * Find all applications submitted by a specific citizen.
 */
const findByCitizenId = async (citizenId) => {
  return prisma.application.findMany({
    where: { citizenId },
    include: INCLUDE_RELATIONS,
    orderBy: { submittedAt: 'desc' },
  });
};

/**
 * Find all applications for a specific scheme.
 */
const findBySchemeId = async (schemeId) => {
  return prisma.application.findMany({
    where: { schemeId },
    include: INCLUDE_RELATIONS,
    orderBy: { submittedAt: 'desc' },
  });
};

/**
 * Check if a citizen already applied for a scheme (prevent duplicates).
 */
const findDuplicate = async (citizenId, schemeId) => {
  return prisma.application.findFirst({
    where: { citizenId, schemeId },
  });
};

/**
 * Create a new application.
 */
const create = async (data) => {
  return prisma.application.create({
    data,
    include: INCLUDE_RELATIONS,
  });
};

/**
 * Update application fields (typically status + remarks).
 */
const update = async (id, data) => {
  return prisma.application.update({
    where: { id },
    data,
    include: INCLUDE_RELATIONS,
  });
};

/**
 * Delete an application by ID.
 */
const remove = async (id) => {
  return prisma.application.delete({ where: { id } });
};

module.exports = {
  findAll,
  findById,
  findByCitizenId,
  findBySchemeId,
  findDuplicate,
  create,
  update,
  remove,
};