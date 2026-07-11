const citizenService = require('../../services/citizen.service');
const schemeService = require('../../services/scheme.service');
const applicationService = require('../../services/application.service');

exports.routeAction = async (action, payload) => {
  switch (action) {
    case 'registerCitizen': return await citizenService.createCitizen(payload);
    case 'findCitizen': return await citizenService.getCitizenByAadhaar(payload.aadhaar);
    case 'listSchemes': return await schemeService.getAllSchemes({});
    case 'applyScheme': return await applicationService.createApplication(payload);
    default: throw new Error('Unsupported action: ' + action);
  }
};
