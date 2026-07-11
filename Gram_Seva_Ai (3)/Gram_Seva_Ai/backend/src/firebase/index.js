const { startListener, stopListener } = require('./request/snapshotListener');
const { startCron, stopCron } = require('./scheduler/cron');

exports.startFirebaseSync = () => {
  startListener();
  startCron();
};

exports.stopFirebaseSync = () => {
  stopListener();
  stopCron();
};
