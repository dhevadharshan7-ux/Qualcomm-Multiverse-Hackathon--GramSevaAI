const fs = require('fs');
const path = require('path');
const base = 'src/firebase';

const files = {
  'constants.js': `
module.exports = {
  COLLECTIONS: {
    REQUESTS: 'gram_seva_requests',
    RESPONSES: 'gram_seva_responses',
    LIVE: 'gram_seva_live'
  },
  STATUS: { PENDING: 'pending', PROCESSING: 'processing', COMPLETED: 'completed', FAILED: 'failed' }
};
`,
  'request/validators.js': `
exports.validatePayload = (payload) => {
  if (!payload || !payload.action) throw new Error('Invalid payload: missing action');
  return true;
};
`,
  'request/actionRouter.js': `
const citizenService = require('../../services/citizen.service');
const schemeService = require('../../services/scheme.service');
const applicationService = require('../../services/application.service');

exports.routeAction = async (action, payload) => {
  switch (action) {
    case 'registerCitizen': return await citizenService.createCitizen(payload);
    case 'findCitizen': return await citizenService.getCitizenByAadhaar(payload.aadhaar);
    case 'listSchemes': return await schemeService.getAllSchemes({});
    case 'applyScheme': return await applicationService.createApplication(payload);
    default: throw new Error('Unsupported action: ' + action);
  }
};
`,
  'publish/responsePublisher.js': `
const { db, admin } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
const logger = require('../../config/logger');

exports.publishResponse = async (requestId, success, message, data = null) => {
  if (!db) return;
  try {
    await db.collection(COLLECTIONS.RESPONSES).doc(requestId).set({
      requestId, success, message, data, timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) { logger.error('Failed to publish response', { err: err.message }); }
};
`,
  'request/requestDispatcher.js': `
const { routeAction } = require('./actionRouter');
const { validatePayload } = require('./validators');
const { publishResponse } = require('../publish/responsePublisher');
const { STATUS } = require('../constants');
const logger = require('../../config/logger');

exports.dispatch = async (doc) => {
  const reqData = doc.data();
  try {
    await doc.ref.update({ status: STATUS.PROCESSING });
    validatePayload(reqData);
    const result = await routeAction(reqData.action, reqData.payload);
    await publishResponse(doc.id, true, 'Success', result);
    await doc.ref.update({ status: STATUS.COMPLETED });
  } catch (err) {
    logger.error('Dispatch failed', { err: err.message });
    await publishResponse(doc.id, false, err.message);
    await doc.ref.update({ status: STATUS.FAILED });
  }
};
`,
  'request/snapshotListener.js': `
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
`,
  'publish/citizenPublisher.js': `
const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishCitizen = async (citizen) => {
  if (!db || !citizen) return;
  await db.collection(COLLECTIONS.LIVE).doc(\`citizen_\${citizen.id}\`).set({ type: 'citizen', data: citizen });
};
`,
  'publish/schemePublisher.js': `
const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishScheme = async (scheme) => {
  if (!db || !scheme) return;
  await db.collection(COLLECTIONS.LIVE).doc(\`scheme_\${scheme.id}\`).set({ type: 'scheme', data: scheme });
};
`,
  'publish/applicationPublisher.js': `
const { db } = require('../firebaseAdmin');
const { COLLECTIONS } = require('../constants');
exports.publishApplication = async (app) => {
  if (!db || !app) return;
  await db.collection(COLLECTIONS.LIVE).doc(\`app_\${app.id}\`).set({ type: 'application', data: app });
};
`,
  'sync/databaseToFirebase.js': `
const citizenPub = require('../publish/citizenPublisher');
const schemePub = require('../publish/schemePublisher');
const appPub = require('../publish/applicationPublisher');
const logger = require('../../config/logger');

exports.prismaFirebaseExtension = {
  name: 'FirebaseSync',
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result);
        return result;
      },
      async update({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result);
        return result;
      },
      async delete({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result, true);
        return result;
      }
    }
  }
};

function syncModel(model, data, isDelete = false) {
  setTimeout(async () => {
    try {
      if (isDelete) return; 
      if (model === 'Citizen') await citizenPub.publishCitizen(data);
      if (model === 'Scheme') await schemePub.publishScheme(data);
      if (model === 'Application') await appPub.publishApplication(data);
    } catch(err) {
      logger.error('Sync failed', { model, err: err.message });
    }
  }, 0);
}
`,
  'verify/hourlyVerification.js': `
const logger = require('../../config/logger');
exports.runVerification = async () => {
  logger.info('Running hourly Firebase verification (stub)');
};
`,
  'scheduler/cron.js': `
const cron = require('node-cron');
const { runVerification } = require('../verify/hourlyVerification');
const logger = require('../../config/logger');

let task = null;
exports.startCron = () => {
  logger.info('Starting Firebase cron scheduler');
  task = cron.schedule('0 * * * *', () => {
    runVerification().catch(err => logger.error('Cron failed', err));
  });
};
exports.stopCron = () => { if (task) task.stop(); };
`,
  'index.js': `
const { startListener, stopListener } = require('./request/snapshotListener');
const { startCron, stopCron } = require('./scheduler/cron');

exports.startFirebaseSync = () => {
  startListener();
  startCron();
};

exports.stopFirebaseSync = () => {
  stopListener();
  stopCron();
};
`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(base, relPath), content.trim() + '\n');
}
console.log('Firebase files generated.');
