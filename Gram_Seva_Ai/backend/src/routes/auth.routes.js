/**
 * Auth Routes — /api/auth
 *
 * Officer login only. Citizens never authenticate — see the "no login"
 * product decision documented in citizen.routes.js and SECURITY_CHANGES.md.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/officer/login', authController.officerLogin);

module.exports = router;
