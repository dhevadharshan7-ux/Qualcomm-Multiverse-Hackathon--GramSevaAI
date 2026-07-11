const citizenPub = require('../publish/citizenPublisher');
const schemePub = require('../publish/schemePublisher');
const appPub = require('../publish/applicationPublisher');
const logger = require('../../config/logger');

exports.prismaFirebaseExtension = {
  name: 'FirebaseSync',
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result);
        return result;
      },
      async update({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result);
        return result;
      },
      async delete({ model, operation, args, query }) {
        const result = await query(args);
        syncModel(model, result, true);
        return result;
      }
    }
  }
};

function syncModel(model, data, isDelete = false) {
  setTimeout(async () => {
    try {
      if (isDelete) return; 
      if (model === 'Citizen') await citizenPub.publishCitizen(data);
      if (model === 'Scheme') await schemePub.publishScheme(data);
      if (model === 'Application') await appPub.publishApplication(data);
    } catch(err) {
      logger.error('Sync failed', { model, err: err.message });
    }
  }, 0);
}
