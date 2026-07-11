/**
 * Officer Service — business logic for Panchayat officers.
 */

const officerRepo = require('../repositories/officer.repository');
const { parseIntId } = require('../helpers/index');

const getAllOfficers = async () => officerRepo.findAll();

const getOfficerById = async (id) => officerRepo.findById(parseIntId(id));

const getOfficersByPanchayat = async (panchayatId) =>
  officerRepo.findByPanchayatId(parseIntId(panchayatId));

const createOfficer = async (data) => {
  // Check for duplicate email
  if (data.email) {
    const existing = await officerRepo.findByEmail(data.email);
    if (existing) {
      const err = new Error(`An officer with email "${data.email}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
  }
  return officerRepo.create({
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    designation: data.designation,
    panchayatId: parseIntId(data.panchayatId),
  });
};

const updateOfficer = async (id, data) => officerRepo.update(parseIntId(id), data);

const deleteOfficer = async (id) => officerRepo.remove(parseIntId(id));

module.exports = {
  getAllOfficers,
  getOfficerById,
  getOfficersByPanchayat,
  createOfficer,
  updateOfficer,
  deleteOfficer,
};
