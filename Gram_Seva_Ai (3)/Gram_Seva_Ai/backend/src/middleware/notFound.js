/**
 * Not Found Middleware
 * Handles 404 errors for unrecognized routes.
 */

'use strict';

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
};

module.exports = notFound;
