/**
 * MCP Server — exposes Gram Seva AI tools via the Model Context Protocol.
 *
 * This is a lightweight HTTP-based MCP server.
 * Tool execution flows: MCP call → tools.service.js → services → repositories → Prisma
 * No direct database access here.
 *
 * Endpoints:
 *   GET  /mcp/tools      — List all available tools
 *   POST /mcp/call       — Execute a tool by name
 *   GET  /mcp/health     — Health check
 */

const express = require('express');
const toolDefinitions = require('./tools');
const aiTools = require('../ai/tools.service');
const logger = require('../config/logger');

const mcpRouter = express.Router();

// ─── Tool Registry ────────────────────────────────────────────────────────────

// Map tool name → executor function
const TOOL_EXECUTORS = {
  registerCitizen: (input) => aiTools.registerCitizen(input),
  findCitizen: (input) => aiTools.findCitizen(input.aadhaar),
  findScheme: (input) => aiTools.findScheme(input.query),
  checkEligibility: (input) => aiTools.checkEligibility(input.citizenId, input.schemeId),
  applyScheme: (input) => aiTools.applyScheme(input.citizenId, input.schemeId),
  trackApplication: (input) => aiTools.trackApplication(input.applicationId),
  uploadDocument: (input) => aiTools.uploadDocument(input.citizenId, input.documentType, input.fileUrl),
  raiseComplaint: (input) => aiTools.raiseComplaint(input.citizenId, input.details),
  listDocuments: (input) => aiTools.listDocuments(input.citizenId),
};

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /mcp/health
 */
mcpRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Gram Seva AI MCP Server',
    toolCount: toolDefinitions.length,
    tools: toolDefinitions.map((t) => t.name),
  });
});

/**
 * GET /mcp/tools
 * Returns the list of available tools and their schemas.
 */
mcpRouter.get('/tools', (req, res) => {
  res.json({
    tools: toolDefinitions,
  });
});

/**
 * POST /mcp/call
 * Execute a tool by name.
 *
 * Request body:
 *   { "name": "toolName", "input": { ...toolInputParams } }
 *
 * Response:
 *   { "content": [{ "type": "text", "text": "..." }] }
 */
mcpRouter.post('/call', async (req, res) => {
  const { name, input } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tool name is required.' });
  }

  const executor = TOOL_EXECUTORS[name];
  if (!executor) {
    return res.status(404).json({
      error: `Unknown tool: "${name}". Available tools: ${Object.keys(TOOL_EXECUTORS).join(', ')}`,
    });
  }

  try {
    logger.info(`[MCP] Executing tool: ${name}`, { input });
    const result = await executor(input || {});

    // MCP standard response format
    return res.json({
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
      isError: false,
    });
  } catch (err) {
    logger.error(`[MCP] Tool "${name}" failed`, { error: err.message });
    return res.status(500).json({
      content: [{ type: 'text', text: `Tool error: ${err.message}` }],
      isError: true,
    });
  }
});

module.exports = mcpRouter;