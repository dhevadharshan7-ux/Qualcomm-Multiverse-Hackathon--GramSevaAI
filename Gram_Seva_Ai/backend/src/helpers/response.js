/**
 * Standardized API Response Helpers
 */

const success = (message, data = {}) => {
  return {
    success: true,
    message,
    data
  };
};

const error = (message, errorMsg = '') => {
  return {
    success: false,
    message,
    error: errorMsg
  };
};

module.exports = {
  success,
  error
};
