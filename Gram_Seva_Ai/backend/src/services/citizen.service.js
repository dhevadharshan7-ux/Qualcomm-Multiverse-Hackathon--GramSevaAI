/**
 * Citizen Service — business logic for citizen management.
 */

const citizenRepo = require('../repositories/citizen.repository');
const { parseIntId } = require('../helpers/index');

const getAllCitizens = async () => citizenRepo.findAll();

const getCitizenById = async (id) => citizenRepo.findById(parseIntId(id));

const getCitizenByAadhaar = async (aadhaar) => citizenRepo.findByAadhaar(aadhaar);

const createCitizen = async (data) => {
  return citizenRepo.create({
    ...data,
    age: parseInt(data.age, 10),
    annualIncome: parseFloat(data.annualIncome),
    villageId: parseIntId(data.villageId),
  });
};

const updateCitizen = async (id, data) => citizenRepo.update(parseIntId(id), data);

const deleteCitizen = async (id) => citizenRepo.remove(parseIntId(id));

module.exports = {
  getAllCitizens,
  getCitizenById,
  getCitizenByAadhaar,
  createCitizen,
  updateCitizen,
  deleteCitizen,
};