const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishCitizen = async (citizen) => {
  if (!db || !citizen) return;
  await db.collection(COLLECTIONS.LIVE).doc(`citizen_${citizen.id}`).set({ type: 'citizen', data: citizen });
};
