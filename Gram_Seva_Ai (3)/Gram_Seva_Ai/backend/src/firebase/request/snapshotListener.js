const { db } = require('../firebaseAdmin');
const { COLLECTIONS, STATUS } = require('../constants');
const { dispatch } = require('./requestDispatcher');
const logger = require('../../config/logger');

let unsubscribe = null;
exports.startListener = () => {
  if (!db) return;
  logger.info('Starting Firebase listener...');
  unsubscribe = db.collection(COLLECTIONS.REQUESTS).where('status', '==', STATUS.PENDING)
    .onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') dispatch(change.doc);
      });
    }, err => logger.error('Listener error', { err: err.message }));
};
exports.stopListener = () => { if (unsubscribe) unsubscribe(); };
