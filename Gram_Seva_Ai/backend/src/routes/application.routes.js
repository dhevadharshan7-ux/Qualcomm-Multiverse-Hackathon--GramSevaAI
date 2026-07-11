/**
 * Application Routes — /api/applications
 */

const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { applicationSchema, statusUpdateSchema } = require('../validators/application.validator');

// Submission stays open — citizens apply with no login (see citizen.routes.js).
router.get('/', applicationController.getAll);
router.get('/citizen/:citizenId', applicationController.getByCitizen);
router.get('/scheme/:schemeId', applicationController.getByScheme);
router.get('/:id', applicationController.getById);
router.post('/', validate(applicationSchema), applicationController.create);

// Officer-only actions.
router.patch('/:id/status', auth, validate(statusUpdateSchema), applicationController.updateStatus);
// DELETE wasn't in the explicit route list we were handed, but it's the same
// class of destructive officer action as the DELETEs on citizens/officers/
// documents/panchayats/villages, so it gets the same guard for consistency.
router.delete('/:id', auth, applicationController.delete);

module.exports = router;