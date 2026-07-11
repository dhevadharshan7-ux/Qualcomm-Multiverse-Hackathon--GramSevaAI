/**
 * Firebase Request Router
 * Maps incoming Firebase request actions directly to the existing Service layer.
 * No business logic should reside here.
 */

const citizenService = require('../services/citizen.service');
const schemeService = require('../services/scheme.service');
const applicationService = require('../services/application.service');
const documentService = require('../services/document.service');
const eligibilityService = require('../services/eligibility.service');
const grievanceService = require('../services/grievance.service');

/**
 * Routes an incoming Firebase action to the correct Service method.
 * 
 * @param {string} action - The action string from the Firebase payload
 * @param {object} payload - The payload data
 * @returns {Promise<{ message: string, data?: any }>}
 */
const routeRequest = async (action, payload) => {
  switch (action) {
    // Citizen Domain
    case 'registerCitizen':
      const newCitizen = await citizenService.createCitizen(payload);
      return { message: 'Citizen created successfully', data: newCitizen };

    case 'findCitizen':
      if (!payload.aadhaar) throw new Error('aadhaar is required in payload');
      const citizen = await citizenService.getCitizenByAadhaar(payload.aadhaar);
      if (!citizen) throw new Error('Citizen not found with this Aadhaar');
      return { message: 'Citizen fetched successfully', data: citizen };

    case 'updateCitizen':
      if (!payload.id) throw new Error('id is required in payload');
      const updatedCitizen = await citizenService.updateCitizen(payload.id, payload);
      return { message: 'Citizen updated successfully', data: updatedCitizen };

    case 'deleteCitizen':
      if (!payload.id) throw new Error('id is required in payload');
      await citizenService.deleteCitizen(payload.id);
      return { message: 'Citizen deleted successfully', data: null };

    // Scheme Domain
    case 'findScheme':
      if (!payload.query) throw new Error('query is required in payload');
      const schemesFound = await schemeService.searchSchemes(payload.query);
      return { message: 'Schemes search results', data: schemesFound };

    case 'listSchemes':
      const allSchemes = await schemeService.getAllSchemes({ includeRules: payload.includeRules });
      return { message: 'Schemes fetched successfully', data: allSchemes };

    // Application Domain
    case 'applyScheme':
      if (!payload.citizenId || !payload.schemeId) {
        throw new Error('citizenId and schemeId are required in payload');
      }
      const application = await applicationService.createApplication(payload);
      return { message: 'Application submitted successfully', data: application };

    case 'trackApplication':
      if (!payload.applicationId) throw new Error('applicationId is required in payload');
      const trackedApplication = await applicationService.getApplicationById(payload.applicationId);
      if (!trackedApplication) throw new Error('Application not found');
      return { message: 'Application fetched successfully', data: trackedApplication };

    // Document Domain
    case 'uploadDocument':
      if (!payload.citizenId || !payload.documentType || !payload.fileUrl) {
        throw new Error('citizenId, documentType, and fileUrl are required in payload');
      }
      const document = await documentService.createDocument(payload);
      return { message: 'Document registered successfully', data: document };

    // Complaint / Grievance Domain
    // Delegates to the teammate's Python FastAPI Grievance Platform, which
    // owns grievance persistence (see /shared/CONTRACT.md §4). This project
    // does not store grievances itself.
    case 'raiseComplaint': {
      const complaint = await grievanceService.raiseComplaint(payload);
      return { message: 'Complaint registered successfully', data: complaint };
    }

    case 'listComplaints': {
      // NOTE: the Python service only supports lookup by id, not "list all".
      // payload must include grievanceId.
      const complaint = await grievanceService.listComplaints(payload);
      return { message: 'Complaint fetched successfully', data: complaint };
    }

    default:
      throw new Error(`Unsupported action: ${action}`);
  }
};

module.exports = {
  routeRequest,
};
