/**
 * Panchayat Routes — /api/panchayats
 */

const express = require('express');
const router = express.Router();
const panchayatController = require('../controllers/panchayat.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { panchayatSchema } = require('../validators/panchayat.validator');

router.get('/', panchayatController.getAll);
router.get('/search', panchayatController.getByDistrict);
router.get('/:id', panchayatController.getById);
router.post('/', auth, validate(panchayatSchema), panchayatController.create);
router.put('/:id', auth, validate(panchayatSchema), panchayatController.update);
router.delete('/:id', auth, panchayatController.delete);

module.exports = router;