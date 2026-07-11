/**
 * Eligibility Routes — /api/eligibility
 */

const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibility.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { eligibilityRuleSchema } = require('../validators/eligibility.validator');

// Core eligibility check — MUST come before /:id. Stays open — citizens
// need to self-check eligibility with no login.
router.get('/check', eligibilityController.check);

// EligibilityRule reads stay open (drive the citizen-facing check above).
router.get('/', eligibilityController.getAllRules);
router.get('/scheme/:schemeId', eligibilityController.getRulesByScheme);
router.get('/:id', eligibilityController.getRuleById);

// Rule administration is officer-only.
router.post('/', auth, validate(eligibilityRuleSchema), eligibilityController.createRule);
router.put('/:id', auth, validate(eligibilityRuleSchema), eligibilityController.updateRule);
router.delete('/:id', auth, eligibilityController.deleteRule);

module.exports = router;