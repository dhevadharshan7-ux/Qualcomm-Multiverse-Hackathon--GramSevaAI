/**
 * Application Routes — /api/applications
 */

const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const validate = require('../middleware/validate');
const { applicationSchema, statusUpdateSchema } = require('../validators/application.validator');

router.get('/', applicationController.getAll);
router.get('/citizen/:citizenId', applicationController.getByCitizen);
router.get('/scheme/:schemeId', applicationController.getByScheme);
router.get('/:id', applicationController.getById);
router.post('/', validate(applicationSchema), applicationController.create);
router.patch('/:id/status', validate(statusUpdateSchema), applicationController.updateStatus);
router.delete('/:id', applicationController.delete);

module.exports = router;