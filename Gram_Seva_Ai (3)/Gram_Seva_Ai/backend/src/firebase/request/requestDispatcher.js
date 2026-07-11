const { routeAction } = require('./actionRouter');
const { validatePayload } = require('./validators');
const { publishResponse } = require('../publish/responsePublisher');
const { STATUS } = require('../constants');
const logger = require('../../config/logger');

exports.dispatch = async (doc) => {
  const reqData = doc.data();
  try {
    await doc.ref.update({ status: STATUS.PROCESSING });
    validatePayload(reqData);
    const result = await routeAction(reqData.action, reqData.payload);
    await publishResponse(doc.id, true, 'Success', result);
    await doc.ref.update({ status: STATUS.COMPLETED });
  } catch (err) {
    logger.error('Dispatch failed', { err: err.message });
    await publishResponse(doc.id, false, err.message);
    await doc.ref.update({ status: STATUS.FAILED });
  }
};
