/**
 * Gram Seva AI — Express Application
 *
 * Registers all middleware and mounts all API route groups.
 * This file is API-only. The React frontend (port 5173) is separate.
 *
 * All endpoints are prefixed with /api
 */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const loggerMiddleware = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// CORS: only allow the Vite frontend dev server (and any configured origin)
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security Headers
app.use(helmet());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Static file serving for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, config.uploadDir)));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gram Seva AI API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/citizens',     require('./routes/citizen.routes'));
app.use('/api/schemes',      require('./routes/scheme.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/officers',     require('./routes/officer.routes'));
app.use('/api/villages',     require('./routes/village.routes'));
app.use('/api/panchayats',   require('./routes/panchayat.routes'));
app.use('/api/documents',    require('./routes/document.routes'));
app.use('/api/eligibility',  require('./routes/eligibility.routes'));
app.use('/api/ai',           require('./routes/ai.routes'));
app.use('/api/audit',        require('./routes/audit.routes'));
app.use('/api/whatsapp',     require('./routes/whatsapp.routes'));

// ─── MCP Server ───────────────────────────────────────────────────────────────

app.use('/mcp', require('./mcp/server'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use(notFound);

// ─── Global Error Handler (must be last) ─────────────────────────────────────

app.use(errorHandler);

module.exports = app;