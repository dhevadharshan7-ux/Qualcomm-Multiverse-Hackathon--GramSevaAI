/**
 * Firebase Admin Initialization
 * Safely initializes the firebase-admin SDK.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const config = require('./firebase.config');
const logger = require('../config/logger');

let db = null;

try {
  // Check if we have credentials
  if (config.projectId && config.clientEmail && config.privateKey) {
    initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
    db = getFirestore();
    logger.info('🔥 Firebase Admin SDK initialized successfully.');
  } else {
    logger.warn('⚠️ Firebase credentials missing in .env. Firebase sync is disabled.');
  }
} catch (error) {
  logger.error('❌ Failed to initialize Firebase Admin SDK', { error: error.message });
}

module.exports = {
  db,
  FieldValue,
};
