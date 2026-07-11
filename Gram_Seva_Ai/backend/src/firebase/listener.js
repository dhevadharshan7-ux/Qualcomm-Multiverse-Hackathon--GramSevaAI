/**
 * Firebase Listener
 * Subscribes to the gram_seva_requests collection and processes pending requests.
 */

const { db } = require('./firebaseAdmin');
const { COLLECTIONS, REQUEST_STATUS } = require('./constants');
const { routeRequest } = require('./requestRouter');
const { publishResponse } = require('./publisher');
const logger = require('../config/logger');

let unsubscribe = null;

/**
 * Starts listening to Firestore for new pending requests.
 */
const startListening = () => {
  if (!db) {
    logger.warn('Firebase DB is null. Sync worker will not start listening.');
    return;
  }

  logger.info('🎧 Starting Firestore listener on collection:', { collection: COLLECTIONS.REQUESTS });

  unsubscribe = db.collection(COLLECTIONS.REQUESTS)
    .where('status', '==', REQUEST_STATUS.PENDING)
    .onSnapshot(
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const doc = change.doc;
            const requestId = doc.id;
            const data = doc.data();

            logger.info('📥 New request received from Firestore', { requestId, action: data.action });
            
            try {
              // 1. Mark as processing to prevent duplicate handling
              await doc.ref.update({ status: REQUEST_STATUS.PROCESSING });

              const startTime = Date.now();

              // 2. Route and execute request
              const result = await routeRequest(data.action, data.payload || {});

              const executionTimeMs = Date.now() - startTime;
              logger.info('✅ Request processed successfully', { requestId, action: data.action, executionTimeMs });

              // 3. Publish success response
              await publishResponse(requestId, true, result.message, result.data);

              // 4. Mark request as completed
              await doc.ref.update({ status: REQUEST_STATUS.COMPLETED });

            } catch (error) {
              logger.error('❌ Request processing failed', { requestId, action: data.action, error: error.message });

              // Publish error response
              await publishResponse(requestId, false, 'Action failed', error.message);

              // Mark request as failed
              await doc.ref.update({ status: REQUEST_STATUS.FAILED });
            }
          }
        }
      },
      (error) => {
        // Listener must never crash the app. Just log the error.
        logger.error('🔥 Firestore listener encountered an error', { error: error.message });
      }
    );
};

/**
 * Stops the Firestore listener gracefully.
 */
const stopListening = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    logger.info('🔇 Stopped Firestore listener.');
  }
};

module.exports = {
  startListening,
  stopListening,
};
