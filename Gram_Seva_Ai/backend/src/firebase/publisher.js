/**
 * Firebase Publisher
 * Publishes responses back to Firestore.
 */

const { db, admin } = require('./firebaseAdmin');
const { COLLECTIONS } = require('./constants');
const logger = require('../config/logger');

/**
 * Publishes a response to the gram_seva_responses collection.
 * 
 * @param {string} requestId - The original request ID
 * @param {boolean} success - Whether the request was successful
 * @param {string} message - A human-readable message
 * @param {object} result - The payload (data if success, error if failure)
 */
const publishResponse = async (requestId, success, message, result = null) => {
  if (!db) {
    logger.debug('Firebase DB is null. Skipping publish response.', { requestId });
    return;
  }

  try {
    const payload = {
      requestId,
      success,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (success) {
      payload.result = result;
    } else {
      payload.error = result;
    }

    await db.collection(COLLECTIONS.RESPONSES).doc(requestId).set(payload);
    
    logger.info('📩 Published response to Firestore', { requestId, success });
  } catch (error) {
    logger.error('❌ Failed to publish response to Firestore', { requestId, error: error.message });
  }
};

module.exports = {
  publishResponse,
};
