/**
 * Firebase Module Index
 * Exports the public interface for the Firebase module.
 */

const { startSyncWorker, stopSyncWorker } = require('./syncWorker');
const { startLiveSync, stopLiveSync } = require('./liveSync');
const { admin, db } = require('./firebaseAdmin');

module.exports = {
  startSyncWorker,
  stopSyncWorker,
  startLiveSync,
  stopLiveSync,
  admin, // Exported for testing/admin utilities if needed
  db,
};
