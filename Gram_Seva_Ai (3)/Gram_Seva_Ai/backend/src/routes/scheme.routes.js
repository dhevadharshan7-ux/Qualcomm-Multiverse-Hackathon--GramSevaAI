/**
 * Scheme Routes — /api/schemes
 */

const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const validate = require('../middleware/validate');
const { schemeSchema } = require('../validators/scheme.validator');

router.get('/search', schemeController.search);
router.get('/', schemeController.getAll);
router.get('/:id', schemeController.getById);
router.post('/', validate(schemeSchema), schemeController.create);
router.put('/:id', validate(schemeSchema), schemeController.update);
router.delete('/:id', schemeController.delete);

module.exports = router;