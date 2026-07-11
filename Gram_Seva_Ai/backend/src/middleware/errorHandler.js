/**
 * Global error handler middleware.
 * Must be the LAST middleware registered in app.js.
 * Converts all thrown errors into a standard JSON response.
 */

const logger = require('../config/logger');

// Map Prisma error codes to HTTP status codes
const PRISMA_ERROR_MAP = {
  P2002: { status: 409, message: 'A record with this value already exists.' },
  P2003: { status: 400, message: 'Related record not found. Check your foreign key values.' },
  P2025: { status: 404, message: 'Record not found.' },
  P2016: { status: 400, message: 'Query interpretation error.' },
};

module.exports = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Prisma known errors
  if (err.code && PRISMA_ERROR_MAP[err.code]) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      error: err.meta?.target || err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: err.message,
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired.',
      error: err.message,
    });
  }

  // Generic fallback
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal Server Error',
  });
};