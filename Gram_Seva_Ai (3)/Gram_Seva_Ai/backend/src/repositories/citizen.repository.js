/**
 * Citizen Repository — database access layer for the Citizen model.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.citizen.findMany({
    include: { village: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.citizen.findUnique({
    where: { id },
    include: {
      village: { include: { panchayat: true } },
      documents: true,
      applications: { include: { scheme: { select: { schemeName: true, department: true } } } },
    },
  });
};

const findByAadhaar = async (aadhaar) => {
  return prisma.citizen.findUnique({
    where: { aadhaar },
    include: { village: { select: { id: true, name: true } } },
  });
};

const create = async (data) => {
  return prisma.citizen.create({ data });
};

const update = async (id, data) => {
  return prisma.citizen.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.citizen.delete({ where: { id } });
};

module.exports = { findAll, findById, findByAadhaar, create, update, remove };