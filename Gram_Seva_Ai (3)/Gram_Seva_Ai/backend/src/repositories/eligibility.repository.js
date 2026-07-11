/**
 * Eligibility Repository — database access layer for the EligibilityRule model.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.eligibilityRule.findMany({
    include: { scheme: { select: { id: true, schemeName: true, department: true } } },
    orderBy: { id: 'asc' },
  });
};

const findById = async (id) => {
  return prisma.eligibilityRule.findUnique({
    where: { id },
    include: { scheme: true },
  });
};

/**
 * Fetch all rules for a specific scheme — used by the eligibility engine.
 */
const findBySchemeId = async (schemeId) => {
  return prisma.eligibilityRule.findMany({
    where: { schemeId },
    orderBy: { id: 'asc' },
  });
};

const create = async (data) => {
  return prisma.eligibilityRule.create({
    data,
    include: { scheme: { select: { id: true, schemeName: true } } },
  });
};

const update = async (id, data) => {
  return prisma.eligibilityRule.update({
    where: { id },
    data,
    include: { scheme: { select: { id: true, schemeName: true } } },
  });
};

const remove = async (id) => {
  return prisma.eligibilityRule.delete({ where: { id } });
};

module.exports = { findAll, findById, findBySchemeId, create, update, remove };
