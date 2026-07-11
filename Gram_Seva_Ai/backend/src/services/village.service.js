/**
 * Village Service — business logic for villages.
 */

const villageRepo = require('../repositories/village.repository');
const { parseIntId } = require('../helpers/index');

const getAllVillages = async () => villageRepo.findAll();

const getVillageById = async (id) => villageRepo.findById(parseIntId(id));

const getVillagesByPanchayat = async (panchayatId) =>
  villageRepo.findByPanchayatId(parseIntId(panchayatId));

const createVillage = async (data) =>
  villageRepo.create({
    name: data.name,
    panchayatId: parseIntId(data.panchayatId),
  });

const updateVillage = async (id, data) => villageRepo.update(parseIntId(id), data);

const deleteVillage = async (id) => villageRepo.remove(parseIntId(id));

module.exports = {
  getAllVillages,
  getVillageById,
  getVillagesByPanchayat,
  createVillage,
  updateVillage,
  deleteVillage,
};
