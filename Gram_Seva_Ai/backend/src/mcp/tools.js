/**
 * MCP Tool Definitions — JSON Schema definitions for all 9 Gram Seva AI tools.
 * These definitions are consumed by the MCP server to register tools.
 *
 * No database access here — tool execution flows through tools.service.js → services → repositories.
 */

const toolDefinitions = [
  {
    name: 'registerCitizen',
    description: 'Register a new citizen in the Gram Seva AI system.',
    inputSchema: {
      type: 'object',
      required: ['aadhaar', 'fullName', 'age', 'gender', 'occupation', 'annualIncome', 'villageId'],
      properties: {
        aadhaar: { type: 'string', description: '12-digit Aadhaar number' },
        fullName: { type: 'string', description: 'Full name of the citizen' },
        age: { type: 'integer', minimum: 1, description: 'Age in years' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        phone: { type: 'string', description: '10-digit mobile number (optional)' },
        occupation: { type: 'string', description: 'Citizen occupation' },
        annualIncome: { type: 'number', minimum: 0, description: 'Annual income in INR' },
        caste: { type: 'string', description: 'Caste category (optional)' },
        address: { type: 'string', description: 'Residential address (optional)' },
        villageId: { type: 'integer', description: 'ID of the village the citizen belongs to' },
      },
    },
  },
  {
    name: 'findCitizen',
    description: 'Find a citizen by their 12-digit Aadhaar number.',
    inputSchema: {
      type: 'object',
      required: ['aadhaar'],
      properties: {
        aadhaar: { type: 'string', description: '12-digit Aadhaar number' },
      },
    },
  },
  {
    name: 'findScheme',
    description: 'Search for government schemes by name or department keyword.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Scheme name or department keyword to search' },
      },
    },
  },
  {
    name: 'checkEligibility',
    description: 'Check whether a specific citizen is eligible for a specific government scheme.',
    inputSchema: {
      type: 'object',
      required: ['citizenId', 'schemeId'],
      properties: {
        citizenId: { type: 'integer', description: 'Citizen database ID' },
        schemeId: { type: 'integer', description: 'Scheme database ID' },
      },
    },
  },
  {
    name: 'applyScheme',
    description: 'Submit a scheme application on behalf of a citizen. Performs eligibility check first.',
    inputSchema: {
      type: 'object',
      required: ['citizenId', 'schemeId'],
      properties: {
        citizenId: { type: 'integer', description: 'Citizen database ID' },
        schemeId: { type: 'integer', description: 'Scheme database ID' },
      },
    },
  },
  {
    name: 'trackApplication',
    description: 'Track the status of a citizen application by its ID.',
    inputSchema: {
      type: 'object',
      required: ['applicationId'],
      properties: {
        applicationId: { type: 'integer', description: 'Application database ID' },
      },
    },
  },
  {
    name: 'uploadDocument',
    description: 'Register a document for a citizen (supports external URL storage).',
    inputSchema: {
      type: 'object',
      required: ['citizenId', 'documentType', 'fileUrl'],
      properties: {
        citizenId: { type: 'integer', description: 'Citizen database ID' },
        documentType: {
          type: 'string',
          description: 'Type of document',
          enum: ['AADHAAR', 'PAN', 'INCOME_CERTIFICATE', 'CASTE_CERTIFICATE', 'RESIDENCE_PROOF', 'BANK_PASSBOOK', 'PHOTO', 'OTHER'],
        },
        fileUrl: { type: 'string', description: 'URL where the document is stored' },
      },
    },
  },
  {
    name: 'raiseComplaint',
    description: 'Log a complaint or grievance for a citizen.',
    inputSchema: {
      type: 'object',
      required: ['citizenId', 'details'],
      properties: {
        citizenId: { type: 'integer', description: 'Citizen database ID' },
        details: { type: 'string', description: 'Description of the complaint' },
      },
    },
  },
  {
    name: 'listDocuments',
    description: "List all documents uploaded by a specific citizen.",
    inputSchema: {
      type: 'object',
      required: ['citizenId'],
      properties: {
        citizenId: { type: 'integer', description: 'Citizen database ID' },
      },
    },
  },
];

module.exports = toolDefinitions;