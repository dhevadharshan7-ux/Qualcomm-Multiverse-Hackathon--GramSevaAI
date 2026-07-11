const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishScheme = async (scheme) => {
  if (!db || !scheme) return;
  await db.collection(COLLECTIONS.LIVE).doc(`scheme_${scheme.id}`).set({ type: 'scheme', data: scheme });
};
