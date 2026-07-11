/**
 * Panchayat Repository — database access layer for the Panchayat model.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.panchayat.findMany({
    include: {
      _count: { select: { villages: true, officers: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.panchayat.findUnique({
    where: { id },
    include: {
      villages: true,
      officers: true,
    },
  });
};

const findByDistrict = async (district) => {
  return prisma.panchayat.findMany({
    where: { district: { contains: district, mode: 'insensitive' } },
    include: { _count: { select: { villages: true, officers: true } } },
    orderBy: { name: 'asc' },
  });
};

const create = async (data) => {
  return prisma.panchayat.create({ data });
};

const update = async (id, data) => {
  return prisma.panchayat.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.panchayat.delete({ where: { id } });
};

module.exports = { findAll, findById, findByDistrict, create, update, remove };
