const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishApplication = async (app) => {
  if (!db || !app) return;
  await db.collection(COLLECTIONS.LIVE).doc(`app_${app.id}`).set({ type: 'application', data: app });
};
