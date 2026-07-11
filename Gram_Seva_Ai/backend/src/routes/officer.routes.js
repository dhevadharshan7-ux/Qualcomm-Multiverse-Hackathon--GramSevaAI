/**
 * Officer Routes — /api/officers
 */

const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officer.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { officerSchema } = require('../validators/officer.validator');

router.get('/', officerController.getAll);
router.get('/panchayat/:panchayatId', officerController.getByPanchayat);
router.get('/:id', officerController.getById);
router.post('/', auth, validate(officerSchema), officerController.create);
router.put('/:id', auth, validate(officerSchema), officerController.update);
router.delete('/:id', auth, officerController.delete);

module.exports = router;