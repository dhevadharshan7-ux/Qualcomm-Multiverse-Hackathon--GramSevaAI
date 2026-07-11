/**
 * Firebase Sync Worker
 * Manages the lifecycle of the Firebase listener.
 */

const { startListening, stopListening } = require('./listener');
const logger = require('../config/logger');

const startSyncWorker = () => {
  logger.info('⚙️ Starting Firebase Sync Worker...');
  startListening();
};

const stopSyncWorker = () => {
  logger.info('🛑 Stopping Firebase Sync Worker...');
  stopListening();
};

module.exports = {
  startSyncWorker,
  stopSyncWorker,
};
