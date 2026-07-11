/**
 * Auth Controller — handles HTTP requests for /api/auth.
 */

const authService = require('../services/auth.service');
const res_utils = require('../helpers/response');

exports.officerLogin = async (req, res) => {
  const { email, phone, password } = req.body || {};
  const data = await authService.loginOfficer({ email, phone, password });
  return res.json(res_utils.success('Login successful', data));
};
