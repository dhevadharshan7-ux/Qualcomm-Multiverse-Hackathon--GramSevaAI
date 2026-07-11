/**
 * Scheme Routes — /api/schemes
 */

const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { schemeSchema } = require('../validators/scheme.validator');

// Browsing stays open — citizens need to browse schemes with no login.
router.get('/search', schemeController.search);
router.get('/', schemeController.getAll);
router.get('/:id', schemeController.getById);

// Officer-only administration.
router.post('/', auth, validate(schemeSchema), schemeController.create);
router.put('/:id', auth, validate(schemeSchema), schemeController.update);
router.delete('/:id', auth, schemeController.delete);

module.exports = router;