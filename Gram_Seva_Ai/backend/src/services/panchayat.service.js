/**
 * Panchayat Service — business logic for panchayats.
 */

const panchayatRepo = require('../repositories/panchayat.repository');
const { parseIntId } = require('../helpers/index');

const getAllPanchayats = async () => panchayatRepo.findAll();

const getPanchayatById = async (id) => panchayatRepo.findById(parseIntId(id));

const getPanchayatsByDistrict = async (district) => panchayatRepo.findByDistrict(district);

const createPanchayat = async (data) => panchayatRepo.create(data);

const updatePanchayat = async (id, data) => panchayatRepo.update(parseIntId(id), data);

const deletePanchayat = async (id) => panchayatRepo.remove(parseIntId(id));

module.exports = {
  getAllPanchayats,
  getPanchayatById,
  getPanchayatsByDistrict,
  createPanchayat,
  updatePanchayat,
  deletePanchayat,
};
