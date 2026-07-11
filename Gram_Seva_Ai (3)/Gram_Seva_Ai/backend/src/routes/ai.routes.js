/**
 * AI Routes — /api/ai
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const validate = require('../middleware/validate');
const { chatSchema } = require('../validators/ai.validator');

// Chat
router.post('/chat', validate(chatSchema), aiController.chat);

// Sessions
router.get('/sessions', aiController.listSessions);
router.get('/sessions/:sessionId', aiController.getSession);

// AI Tools (HTTP interface for direct tool access)
router.post('/tools/eligibility', aiController.toolCheckEligibility);
router.post('/tools/apply', aiController.toolApplyScheme);
router.get('/tools/track/:applicationId', aiController.toolTrackApplication);

module.exports = router;