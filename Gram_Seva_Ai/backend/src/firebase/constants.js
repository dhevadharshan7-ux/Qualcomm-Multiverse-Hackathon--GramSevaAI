/**
 * Firebase Constants
 * Defines Firestore collection names to ensure consistency.
 */

module.exports = {
  COLLECTIONS: {
    REQUESTS: 'gram_seva_requests',
    RESPONSES: 'gram_seva_responses',
    LIVE: 'gram_seva_live',
  },
  REQUEST_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
};
