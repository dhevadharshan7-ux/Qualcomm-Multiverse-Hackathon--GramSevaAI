/**
 * Firebase Configuration
 * Reads from environment variables or uses defaults/placeholders
 * if Firebase is not yet fully configured.
 */

const config = require('../config/env'); // to ensure .env is loaded early

module.exports = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Replace escaped newlines with actual newlines in private key
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};
