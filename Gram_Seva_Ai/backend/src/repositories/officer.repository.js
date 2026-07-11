/**
 * Officer Repository — database access layer for the Officer model.
 *
 * IMPORTANT: findAll/findById/findByPanchayatId/create/update explicitly
 * `select` fields and deliberately exclude `passwordHash` — those results
 * are returned straight to HTTP clients via the controller. findByEmail and
 * findByPhone return the full row (including passwordHash) because they
 * exist only to support auth.service's credential check; never pass their
 * result straight back to a client.
 */

const prisma = require('../config/prisma');

const BASE_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  designation: true,
  panchayatId: true,
  createdAt: true,
};

const findAll = async () => {
  return prisma.officer.findMany({
    select: { ...BASE_FIELDS, panchayat: { select: { id: true, name: true, district: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const findById = async (id) => {
  return prisma.officer.findUnique({
    where: { id },
    select: { ...BASE_FIELDS, panchayat: true },
  });
};

const findByPanchayatId = async (panchayatId) => {
  return prisma.officer.findMany({
    where: { panchayatId },
    select: { ...BASE_FIELDS, panchayat: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Auth-only lookup — includes passwordHash. Never expose this result
 * directly via a controller response.
 */
const findByEmail = async (email) => {
  return prisma.officer.findUnique({ where: { email } });
};

/**
 * Auth-only lookup — includes passwordHash. Never expose this result
 * directly via a controller response. `phone` is not unique in the schema,
 * so this resolves to the first match.
 */
const findByPhone = async (phone) => {
  return prisma.officer.findFirst({ where: { phone } });
};

const create = async (data) => {
  return prisma.officer.create({
    data,
    select: { ...BASE_FIELDS, panchayat: { select: { id: true, name: true } } },
  });
};

const update = async (id, data) => {
  return prisma.officer.update({
    where: { id },
    data,
    select: { ...BASE_FIELDS, panchayat: { select: { id: true, name: true } } },
  });
};

const remove = async (id) => {
  return prisma.officer.delete({ where: { id } });
};

module.exports = { findAll, findById, findByPanchayatId, findByEmail, findByPhone, create, update, remove };
