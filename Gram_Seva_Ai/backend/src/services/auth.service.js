/**
 * Auth Service — officer login.
 *
 * Citizens never authenticate (see routes for the product rationale — the
 * platform's whole premise is a villager speaking with no account/login).
 * This service is officer-only.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const officerRepo = require('../repositories/officer.repository');
const config = require('../config/env');

/**
 * Verify officer credentials (email or phone + password) and issue a JWT.
 *
 * @param {object} creds
 * @param {string} [creds.email]
 * @param {string} [creds.phone]
 * @param {string} creds.password
 * @returns {Promise<{ token: string, officer: object }>}
 */
const loginOfficer = async ({ email, phone, password }) => {
  if (!password || (!email && !phone)) {
    const err = new Error('email or phone, and password, are required.');
    err.statusCode = 400;
    throw err;
  }

  const officer = email
    ? await officerRepo.findByEmail(email)
    : await officerRepo.findByPhone(phone);

  // Same error for "no such officer" and "wrong password" — don't leak
  // which one it was.
  if (!officer || !officer.passwordHash) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, officer.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    {
      officerId: officer.id,
      panchayatId: officer.panchayatId,
      designation: officer.designation,
    },
    config.jwtSecret,
    { expiresIn: config.officerJwtExpiresIn }
  );

  return {
    token,
    expiresIn: config.officerJwtExpiresIn,
    officer: {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      phone: officer.phone,
      designation: officer.designation,
      panchayatId: officer.panchayatId,
    },
  };
};

module.exports = { loginOfficer };
