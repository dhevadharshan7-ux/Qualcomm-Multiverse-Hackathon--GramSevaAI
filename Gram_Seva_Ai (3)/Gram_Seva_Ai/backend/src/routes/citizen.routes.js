/**
 * Citizen Routes — /api/citizens
 */

const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const validate = require('../middleware/validate');
const { citizenSchema } = require('../validators/citizen.validator');

router.get('/', citizenController.getAll);
router.get('/aadhaar/:aadhaar', citizenController.getByAadhaar);
router.get('/:id', citizenController.getById);
router.post('/', validate(citizenSchema), citizenController.create);
router.put('/:id', validate(citizenSchema), citizenController.update);
router.delete('/:id', citizenController.delete);

module.exports = router;