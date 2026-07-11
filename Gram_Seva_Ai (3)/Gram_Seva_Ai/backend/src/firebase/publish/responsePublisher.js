const { db, FieldValue } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
const logger = require('../../config/logger');

exports.publishResponse = async (requestId, success, message, data = null) => {
  if (!db) return;
  try {
    await db.collection(COLLECTIONS.RESPONSES).doc(requestId).set({
      requestId, success, message, data, timestamp: FieldValue.serverTimestamp()
    });
  } catch (err) { logger.error('Failed to publish response', { err: err.message }); }
};
