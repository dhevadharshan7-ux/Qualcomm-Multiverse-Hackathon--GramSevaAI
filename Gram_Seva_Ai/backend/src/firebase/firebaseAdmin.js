/**
 * Firebase Admin Initialization
 * Safely initializes the firebase-admin SDK.
 */

const admin = require('firebase-admin');
const config = require('./firebase.config');
const logger = require('../config/logger');

let db = null;

try {
  // Check if we have credentials
  if (config.projectId && config.clientEmail && config.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
    db = admin.firestore();
    logger.info('🔥 Firebase Admin SDK initialized successfully.');
  } else {
    logger.warn('⚠️ Firebase credentials missing in .env. Firebase sync is disabled.');
  }
} catch (error) {
  logger.error('❌ Failed to initialize Firebase Admin SDK', { error: error.message });
}

module.exports = {
  admin,
  db,
};
