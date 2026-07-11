const cron = require('node-cron');
const { runVerification } = require('../verify/hourlyVerification');
const logger = require('../../config/logger');

let task = null;
exports.startCron = () => {
  logger.info('Starting Firebase cron scheduler');
  task = cron.schedule('0 * * * *', () => {
    runVerification().catch(err => logger.error('Cron failed', err));
  });
};
exports.stopCron = () => { if (task) task.stop(); };
