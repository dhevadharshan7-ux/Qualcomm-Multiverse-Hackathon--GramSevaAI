/**
 * Officer Repository — database access layer for the Officer model.
 */

const prisma = require('../config/prisma');

const findAll = async () => {
  return prisma.officer.findMany({
    include: { panchayat: { select: { id: true, name: true, district: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.officer.findUnique({
    where: { id },
    include: { panchayat: true },
  });
};

const findByPanchayatId = async (panchayatId) => {
  return prisma.officer.findMany({
    where: { panchayatId },
    include: { panchayat: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const findByEmail = async (email) => {
  return prisma.officer.findUnique({ where: { email } });
};

const create = async (data) => {
  return prisma.officer.create({
    data,
    include: { panchayat: { select: { id: true, name: true } } },
  });
};

const update = async (id, data) => {
  return prisma.officer.update({
    where: { id },
    data,
    include: { panchayat: { select: { id: true, name: true } } },
  });
};

const remove = async (id) => {
  return prisma.officer.delete({ where: { id } });
};

module.exports = { findAll, findById, findByPanchayatId, findByEmail, create, update, remove };
