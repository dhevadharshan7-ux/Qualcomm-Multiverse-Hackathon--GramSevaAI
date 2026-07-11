/**
 * Citizen Routes — /api/citizens
 *
 * PRODUCT DECISION (not an oversight): citizen-facing intake stays
 * unauthenticated. The platform's whole design premise is that a villager
 * interacts by voice with no account/login (see architecture docs) — so
 * registration, lookups, and self-service updates here are deliberately
 * open. Only the destructive DELETE is officer-gated.
 *
 * The Aadhaar lookup is the one open route that returns a full PII record
 * from a guessable 12-digit input, so it gets its own tight rate limit and
 * an audit-log entry on every attempt (see citizen.controller.js) instead
 * of authentication.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const citizenController = require('../controllers/citizen.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { citizenSchema } = require('../validators/citizen.validator');

// Tight rate limit scoped only to the Aadhaar lookup — blunts enumeration
// attacks against a fully-open, no-auth PII lookup endpoint.
const aadhaarLookupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many Aadhaar lookup attempts from this address. Please try again later.',
  },
});

router.get('/', citizenController.getAll);
router.get('/aadhaar/:aadhaar', aadhaarLookupLimiter, citizenController.getByAadhaar);
router.get('/:id', citizenController.getById);
router.post('/', validate(citizenSchema), citizenController.create);
router.put('/:id', validate(citizenSchema), citizenController.update);
router.delete('/:id', auth, citizenController.delete);

module.exports = router;