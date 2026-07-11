/**
 * Village Repository — database access layer for the Village model.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.village.findMany({
    include: {
      panchayat: { select: { id: true, name: true, district: true, state: true } },
      _count: { select: { citizens: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.village.findUnique({
    where: { id },
    include: {
      panchayat: true,
      _count: { select: { citizens: true } },
    },
  });
};

const findByPanchayatId = async (panchayatId) => {
  return prisma.village.findMany({
    where: { panchayatId },
    include: { _count: { select: { citizens: true } } },
    orderBy: { name: 'asc' },
  });
};

const create = async (data) => {
  return prisma.village.create({
    data,
    include: { panchayat: { select: { id: true, name: true } } },
  });
};

const update = async (id, data) => {
  return prisma.village.update({
    where: { id },
    data,
    include: { panchayat: { select: { id: true, name: true } } },
  });
};

const remove = async (id) => {
  return prisma.village.delete({ where: { id } });
};

module.exports = { findAll, findById, findByPanchayatId, create, update, remove };
