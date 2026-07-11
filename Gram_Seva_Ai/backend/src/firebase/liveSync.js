/**
 * Firebase Live Sync
 *
 * Every 60 seconds, mirrors current Postgres state into the
 * `gram_seva_live` Firestore collection, matching the shape the React
 * frontend already expects (see /react_firebase_integration.md's
 * useLiveCitizens() example): each doc is `{ type: '<entity>', data: {...} }`,
 * filtered client-side by `type`.
 *
 * This is a best-effort polling mirror, not real-time CDC — good enough for
 * a hackathon demo dashboard, not a substitute for the request/response
 * queue in listener.js/publisher.js (which stays authoritative for writes).
 *
 * Covers:
 *   - citizens     (via Prisma — this project's schema)
 *   - applications (via Prisma — this project's schema)
 *   - schemes      (via Prisma — the bulk-imported catalog, see prisma/seed.js)
 *   - grievances   (raw SQL — owned by the Python Grievance Platform's
 *                   SQLAlchemy models, not in prisma/schema.prisma, but
 *                   lives in the same shared Postgres database)
 *
 * Uses a stable Firestore doc ID per row (`citizen_${id}`, `grievance_${id}`,
 * etc.) so repeated ticks upsert instead of duplicating documents.
 */

const { db } = require('./firebaseAdmin');
const { COLLECTIONS } = require('./constants');
const prisma = require('../config/prisma');
const logger = require('../config/logger');

const SYNC_INTERVAL_MS = 60 * 1000;

// Firestore rejects batched writes over 500 operations — stay safely under
// that regardless of how many rows exist.
const FIRESTORE_BATCH_LIMIT = 450;

let intervalHandle = null;

/**
 * Strip Prisma/pg-driver-specific value types (Date, Decimal, etc.) down to
 * plain JSON-safe values before handing them to the Firestore SDK.
 */
const toPlain = (value) => JSON.parse(JSON.stringify(value));

const collectCitizenDocs = async () => {
  const citizens = await prisma.citizen.findMany({ orderBy: { updatedAt: 'desc' } });
  return citizens.map((citizen) => ({
    id: `citizen_${citizen.id}`,
    type: 'citizen',
    data: toPlain(citizen),
  }));
};

const collectApplicationDocs = async () => {
  const applications = await prisma.application.findMany({ orderBy: { updatedAt: 'desc' } });
  return applications.map((application) => ({
    id: `application_${application.id}`,
    type: 'application',
    data: toPlain(application),
  }));
};

const collectSchemeDocs = async () => {
  const schemes = await prisma.scheme.findMany({ orderBy: { schemeName: 'asc' } });
  return schemes.map((scheme) => ({
    id: `scheme_${scheme.id}`,
    type: 'scheme',
    data: toPlain(scheme),
  }));
};

/**
 * `grievances` isn't in this project's Prisma schema — it's owned by the
 * Python Grievance Platform (see /shared/schema.sql). We only SELECT from
 * it; we never manage its schema or write to it from Node.
 */
const collectGrievanceDocs = async () => {
  let rows;
  try {
    rows = await prisma.$queryRawUnsafe(
      'SELECT id, citizen_id, category, description, location, priority, source_channel, ' +
        'status, department, sensor_device, sensor_resource, sensor_value, sensor_verdict, ' +
        'created_at, updated_at FROM grievances ORDER BY updated_at DESC LIMIT 2000'
    );
  } catch (err) {
    // Table may not exist yet (Python side's schema.sql not applied, or no
    // grievance raised yet in this demo run). Don't fail the whole tick.
    logger.debug('liveSync: could not read grievances table (may not exist yet)', {
      error: err.message,
    });
    return [];
  }

  return rows.map((row) => ({
    id: `grievance_${row.id}`,
    type: 'grievance',
    data: toPlain(row),
  }));
};

const commitInChunks = async (docs) => {
  for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach(({ id, type, data }) => {
      const ref = db.collection(COLLECTIONS.LIVE).doc(id);
      batch.set(ref, { type, data }, { merge: true });
    });
    await batch.commit();
  }
};

const runSyncTick = async () => {
  if (!db) return;

  try {
    const [citizenDocs, applicationDocs, schemeDocs, grievanceDocs] = await Promise.all([
      collectCitizenDocs(),
      collectApplicationDocs(),
      collectSchemeDocs(),
      collectGrievanceDocs(),
    ]);

    const allDocs = [...citizenDocs, ...applicationDocs, ...schemeDocs, ...grievanceDocs];
    await commitInChunks(allDocs);

    logger.debug('🔄 liveSync tick complete', {
      citizens: citizenDocs.length,
      applications: applicationDocs.length,
      schemes: schemeDocs.length,
      grievances: grievanceDocs.length,
    });
  } catch (err) {
    // Never let a bad tick crash the interval — just log and try again next time.
    logger.error('❌ liveSync tick failed', { error: err.message });
  }
};

const startLiveSync = () => {
  if (!db) {
    logger.warn('Firebase DB is null. Live sync (gram_seva_live mirror) will not start.');
    return;
  }
  if (intervalHandle) return; // already running

  logger.info('🔄 Starting Postgres → gram_seva_live mirror (every 60s)...');
  runSyncTick(); // run once immediately so the dashboard isn't empty for the first 60s
  intervalHandle = setInterval(runSyncTick, SYNC_INTERVAL_MS);
};

const stopLiveSync = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('🛑 Stopped Postgres → gram_seva_live mirror.');
  }
};

module.exports = { startLiveSync, stopLiveSync };
