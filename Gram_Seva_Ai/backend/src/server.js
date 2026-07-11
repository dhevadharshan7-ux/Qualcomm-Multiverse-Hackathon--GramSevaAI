/**
 * Gram Seva AI — Server Entry Point
 *
 * Starts the Express server on the configured port.
 * Handles graceful shutdown on SIGINT / SIGTERM.
 */

'use strict';

const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');
const logger = require('./config/logger');
const fs = require('fs');
const path = require('path');
const { startSyncWorker, stopSyncWorker, startLiveSync, stopLiveSync, db: firebaseDb } = require('./firebase');

// ─── Ensure uploads directory exists ─────────────────────────────────────────

const uploadsDir = path.join(__dirname, config.uploadDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory: ${uploadsDir}`);
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const server = app.listen(config.port, () => {
  logger.info(`🚀 Gram Seva AI API is running`, {
    port: config.port,
    env: config.nodeEnv,
    url: `http://localhost:${config.port}`,
  });
  logger.info('📋 API Routes', {
    health:      `GET  http://localhost:${config.port}/api/health`,
    citizens:    `GET  http://localhost:${config.port}/api/citizens`,
    schemes:     `GET  http://localhost:${config.port}/api/schemes`,
    applications:`GET  http://localhost:${config.port}/api/applications`,
    eligibility: `GET  http://localhost:${config.port}/api/eligibility/check`,
    ai:          `POST http://localhost:${config.port}/api/ai/chat`,
    mcp:         `GET  http://localhost:${config.port}/mcp/tools`,
    whatsapp:    `GET  http://localhost:${config.port}/api/whatsapp/webhook`,
  });

  // ─── Firebase Bridge (Firestore request queue + live mirror) ─────────────
  // Both are safe no-ops if Firebase Admin never initialized (missing
  // FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) —
  // firebaseAdmin.js already logs that case, so we just skip starting them.
  if (firebaseDb) {
    startSyncWorker();
    startLiveSync();
    logger.info('🔥 Firebase bridge active: request queue listener + gram_seva_live mirror (60s) started.');
  } else {
    logger.warn('⚠️ Firebase Admin not initialized — Firebase bridge (sync worker + live mirror) is inactive.');
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (firebaseDb) {
    stopSyncWorker();
    stopLiveSync();
  }

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error('Error closing DB connection', { error: err.message });
    }
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});