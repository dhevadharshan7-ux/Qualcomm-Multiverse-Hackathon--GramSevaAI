/**
 * JWT Authentication middleware.
 * Protects routes that require a valid Bearer token.
 *
 * Usage in routes:
 *   const auth = require('../middleware/auth');
 *   router.get('/protected', auth, controller.handler);
 *
 * To skip auth on a route, simply don't add this middleware.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a Bearer token.',
      error: 'MISSING_TOKEN',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Attach decoded payload to request
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid token.',
      error: err.message,
    });
  }
};