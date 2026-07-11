/**
 * Eligibility Routes — /api/eligibility
 */

const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibility.controller');
const validate = require('../middleware/validate');
const { eligibilityRuleSchema } = require('../validators/eligibility.validator');

// Core eligibility check — MUST come before /:id
router.get('/check', eligibilityController.check);

// EligibilityRule CRUD
router.get('/', eligibilityController.getAllRules);
router.get('/scheme/:schemeId', eligibilityController.getRulesByScheme);
router.get('/:id', eligibilityController.getRuleById);
router.post('/', validate(eligibilityRuleSchema), eligibilityController.createRule);
router.put('/:id', validate(eligibilityRuleSchema), eligibilityController.updateRule);
router.delete('/:id', eligibilityController.deleteRule);

module.exports = router;