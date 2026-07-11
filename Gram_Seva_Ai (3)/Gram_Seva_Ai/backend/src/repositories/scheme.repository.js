/**
 * Scheme Repository — database access layer for the Scheme model.
 * Only Prisma calls live here. No business logic.
 */

const prisma = require('../config/prisma');

/**
 * Fetch all schemes, optionally including their eligibility rules.
 */
const findAll = async ({ includeRules = false } = {}) => {
  return prisma.scheme.findMany({
    include: { rules: includeRules },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Find a single scheme by primary key.
 */
const findById = async (id) => {
  return prisma.scheme.findUnique({
    where: { id },
    include: { rules: true },
  });
};

/**
 * Find a scheme by its unique name.
 */
const findByName = async (schemeName) => {
  return prisma.scheme.findUnique({
    where: { schemeName },
    include: { rules: true },
  });
};

/**
 * Find all schemes belonging to a department.
 */
const findByDepartment = async (department) => {
  return prisma.scheme.findMany({
    where: { department: { contains: department, mode: 'insensitive' } },
    include: { rules: true },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Create a new scheme.
 */
const create = async (data) => {
  return prisma.scheme.create({ data, include: { rules: true } });
};

/**
 * Update an existing scheme by ID.
 */
const update = async (id, data) => {
  return prisma.scheme.update({
    where: { id },
    data,
    include: { rules: true },
  });
};

/**
 * Delete a scheme by ID.
 */
const remove = async (id) => {
  return prisma.scheme.delete({ where: { id } });
};

module.exports = { findAll, findById, findByName, findByDepartment, create, update, remove };