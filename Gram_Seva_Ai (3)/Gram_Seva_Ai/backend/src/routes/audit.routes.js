/**
 * Audit Routes — /api/audit
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');

router.get('/', auditController.getAll);
router.get('/entity', auditController.getByEntity);
router.get('/actor', auditController.getByActor);

module.exports = router;