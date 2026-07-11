/**
 * Panchayat Routes — /api/panchayats
 */

const express = require('express');
const router = express.Router();
const panchayatController = require('../controllers/panchayat.controller');
const validate = require('../middleware/validate');
const { panchayatSchema } = require('../validators/panchayat.validator');

router.get('/', panchayatController.getAll);
router.get('/search', panchayatController.getByDistrict);
router.get('/:id', panchayatController.getById);
router.post('/', validate(panchayatSchema), panchayatController.create);
router.put('/:id', validate(panchayatSchema), panchayatController.update);
router.delete('/:id', panchayatController.delete);

module.exports = router;