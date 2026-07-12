const citizenService = require('../../services/citizen.service');
const schemeService = require('../../services/scheme.service');
const applicationService = require('../../services/application.service');
const orchestratorService = require('../../services/orchestrator.service');

exports.routeAction = async (action, payload) => {
  switch (action) {
    case 'registerCitizen': return await citizenService.createCitizen(payload);
    case 'findCitizen': return await citizenService.getCitizenByAadhaar(payload.aadhaar);
    case 'listSchemes': return await schemeService.getAllSchemes({});
    case 'applyScheme': return await applicationService.createApplication(payload);
    // WhatsApp -> n8n -> Firebase entry point: n8n writes a request shaped
    // { status: 'pending', action: 'handleMessage', payload: { transcript,
    // language, channel: 'whatsapp', citizenId: '<phone>' } } to
    // gram_seva_requests; this forwards it to the Python orchestrator's
    // POST /orchestrate for intent classification + grievance/ID-request
    // creation. See RUNBOOK.md's WhatsApp/n8n section for the exact contract.
    case 'handleMessage': return await orchestratorService.orchestrateMessage(payload);
    default: throw new Error('Unsupported action: ' + action);
  }
};
