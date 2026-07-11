/**
 * Document Routes — /api/documents
 *
 * Two upload strategies:
 *   POST /api/documents/upload — multipart file upload (multer)
 *   POST /api/documents        — JSON with external fileUrl
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { documentSchema } = require('../validators/document.validator');
const config = require('../config/env');
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } = require('../constants/index');

// ─── Multer Config ───────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/', documentController.getAll);
router.get('/citizen/:citizenId', documentController.getByCitizen);

// Authenticated file download — replaces the old public express.static
// mount. Officer-only (see document.controller.js for rationale).
router.get('/:id/file', auth, documentController.downloadFile);

router.get('/:id', documentController.getById);

// Multipart upload — stays open, part of citizen intake.
router.post('/upload', upload.single('file'), documentController.upload);

// URL-based document registration — stays open, part of citizen intake.
router.post('/', validate(documentSchema), documentController.create);

// Officer-only.
router.delete('/:id', auth, documentController.delete);

module.exports = router;