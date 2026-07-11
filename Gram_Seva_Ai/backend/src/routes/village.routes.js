/**
 * Village Routes — /api/villages
 */

const express = require('express');
const router = express.Router();
const villageController = require('../controllers/village.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { villageSchema } = require('../validators/village.validator');

router.get('/', villageController.getAll);
router.get('/panchayat/:panchayatId', villageController.getByPanchayat);
router.get('/:id', villageController.getById);
router.post('/', auth, validate(villageSchema), villageController.create);
router.put('/:id', auth, validate(villageSchema), villageController.update);
router.delete('/:id', auth, villageController.delete);

module.exports = router;