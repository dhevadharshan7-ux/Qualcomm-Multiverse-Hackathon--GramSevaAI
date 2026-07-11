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

  // Start Firebase Synchronization
  const { startFirebaseSync } = require('./firebase');
  startFirebaseSync();
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    
    // Stop Firebase Synchronization
    const { stopFirebaseSync } = require('./firebase');
    stopFirebaseSync();

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