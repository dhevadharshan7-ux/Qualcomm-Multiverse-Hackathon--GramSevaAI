/**
 * Audit Routes — /api/audit
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const auth = require('../middleware/auth');

// All of /api/audit is officer-only — audit logs can contain sensitive
// operational detail (who did what to which citizen/officer record).
router.get('/', auth, auditController.getAll);
router.get('/entity', auth, auditController.getByEntity);
router.get('/actor', auth, auditController.getByActor);

module.exports = router;