const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend');

const structure = {
  'config': {
    'env.js': `require('dotenv').config();\nmodule.exports = { port: process.env.PORT || 3000, dbUrl: process.env.DATABASE_URL, jwtSecret: process.env.JWT_SECRET || 'secret' };`,
    'prisma.js': `const { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();\nmodule.exports = prisma;`
  },
  'routes': {
    'citizen.routes.js': `const express = require('express');\nconst router = express.Router();\nconst citizenController = require('../controllers/citizen.controller');\n\nrouter.get('/', citizenController.getAll);\nrouter.get('/:id', citizenController.getById);\nrouter.post('/', citizenController.create);\nrouter.put('/:id', citizenController.update);\nrouter.delete('/:id', citizenController.delete);\n\nmodule.exports = router;`,
    'scheme.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'application.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'eligibility.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'officer.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'village.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'panchayat.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'document.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'audit.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`,
    'ai.routes.js': `const express = require('express');\nconst router = express.Router();\n// Placeholder routes\nmodule.exports = router;`
  },
  'controllers': {
    'citizen.controller.js': `const citizenService = require('../services/citizen.service');\nconst responseUtils = require('../utils/response');\n\nexports.getAll = async (req, res) => { try { const data = await citizenService.getAllCitizens(); return res.json(responseUtils.success('Citizens fetched successfully', data)); } catch (err) { return res.status(500).json(responseUtils.error('Failed to fetch citizens', err.message)); } };\n\nexports.getById = async (req, res) => { try { const data = await citizenService.getCitizenById(req.params.id); if(!data) return res.status(404).json(responseUtils.error('Citizen not found')); return res.json(responseUtils.success('Citizen fetched successfully', data)); } catch (err) { return res.status(500).json(responseUtils.error('Failed to fetch citizen', err.message)); } };\n\nexports.create = async (req, res) => { try { const data = await citizenService.createCitizen(req.body); return res.status(201).json(responseUtils.success('Citizen created successfully', data)); } catch (err) { return res.status(500).json(responseUtils.error('Failed to create citizen', err.message)); } };\n\nexports.update = async (req, res) => { try { const data = await citizenService.updateCitizen(req.params.id, req.body); return res.json(responseUtils.success('Citizen updated successfully', data)); } catch (err) { return res.status(500).json(responseUtils.error('Failed to update citizen', err.message)); } };\n\nexports.delete = async (req, res) => { try { await citizenService.deleteCitizen(req.params.id); return res.json(responseUtils.success('Citizen deleted successfully', null)); } catch (err) { return res.status(500).json(responseUtils.error('Failed to delete citizen', err.message)); } };`,
    'scheme.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'application.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'eligibility.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'officer.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'village.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'panchayat.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'document.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'audit.controller.js': `// Placeholder code\nmodule.exports = {};`,
    'ai.controller.js': `// Placeholder code\nmodule.exports = {};`
  },
  'services': {
    'citizen.service.js': `const citizenRepo = require('../repositories/citizen.repository');\n\nexports.getAllCitizens = async () => { return await citizenRepo.findAll(); };\nexports.getCitizenById = async (id) => { return await citizenRepo.findById(id); };\nexports.createCitizen = async (data) => { return await citizenRepo.create(data); };\nexports.updateCitizen = async (id, data) => { return await citizenRepo.update(id, data); };\nexports.deleteCitizen = async (id) => { return await citizenRepo.remove(id); };`,
    'scheme.service.js': `// Placeholder code\nmodule.exports = {};`,
    'application.service.js': `// Placeholder code\nmodule.exports = {};`,
    'eligibility.service.js': `// Placeholder code\nmodule.exports = {};`,
    'ai.service.js': `// Placeholder code\nmodule.exports = {};`,
    'document.service.js': `// Placeholder code\nmodule.exports = {};`
  },
  'repositories': {
    'citizen.repository.js': `const prisma = require('../config/prisma');\n\nexports.findAll = async () => { return await prisma.citizen.findMany(); };\nexports.findById = async (id) => { return await prisma.citizen.findUnique({ where: { id: parseInt(id) } }); };\nexports.create = async (data) => { return await prisma.citizen.create({ data }); };\nexports.update = async (id, data) => { return await prisma.citizen.update({ where: { id: parseInt(id) }, data }); };\nexports.remove = async (id) => { return await prisma.citizen.delete({ where: { id: parseInt(id) } }); };`,
    'scheme.repository.js': `const prisma = require('../config/prisma');\nmodule.exports = {};`,
    'application.repository.js': `const prisma = require('../config/prisma');\nmodule.exports = {};`
  },
  'middleware': {
    'auth.js': `module.exports = (req, res, next) => { next(); };`,
    'logger.js': `module.exports = (req, res, next) => { console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`); next(); };`,
    'errorHandler.js': `module.exports = (err, req, res, next) => { console.error(err); res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message }); };`,
    'validate.js': `module.exports = (schema) => (req, res, next) => { next(); };`
  },
  'validators': {
    'citizen.validator.js': `// Placeholder code\nmodule.exports = {};`,
    'scheme.validator.js': `// Placeholder code\nmodule.exports = {};`,
    'application.validator.js': `// Placeholder code\nmodule.exports = {};`
  },
  'utils': {
    'response.js': `exports.success = (message, data) => ({ success: true, message, data });\nexports.error = (message, error) => ({ success: false, message, error });`,
    'constants.js': `module.exports = {};`,
    'helpers.js': `module.exports = {};`,
    'logger.js': `exports.log = (msg) => console.log(msg);`
  },
  'ai': {
    'promptTemplates.js': `module.exports = {};`,
    'eligibilityAgent.js': `module.exports = {};`,
    'conversationAgent.js': `module.exports = {};`,
    'documentAgent.js': `module.exports = {};`
  },
  'mcp': {
    'server.js': `// Placeholder for MCP Server\nmodule.exports = {};`,
    'tools.js': `// Placeholder code\nmodule.exports = {};`,
    'citizens.tool.js': `// Placeholder code\nmodule.exports = {};`,
    'schemes.tool.js': `// Placeholder code\nmodule.exports = {};`,
    'applications.tool.js': `// Placeholder code\nmodule.exports = {};`
  },
  'docs': {
    'api.md': `# API Documentation\n\nDetailed API documentation goes here.`
  },
  'tests': {
    '.gitkeep': ``
  },
  '': {
    'server.js': `const app = require('./app');\nconst config = require('./config/env');\n\napp.listen(config.port, () => {\n  console.log(\`Server is running on port \${config.port}\`);\n});`,
    'app.js': `const express = require('express');\nconst cors = require('cors');\nconst loggerMiddleware = require('./middleware/logger');\nconst errorHandler = require('./middleware/errorHandler');\n\nconst app = express();\n\napp.use(cors());\napp.use(express.json());\napp.use(loggerMiddleware);\n\n// Routes registration\napp.use('/api/citizens', require('./routes/citizen.routes'));\n\napp.use(errorHandler);\n\nmodule.exports = app;`,
    'README.md': `# Gram Seva AI Backend\n\nA production-ready backend for an AI-powered Government Assistance Platform.`
  }
};

function createFiles(dir, struct) {
  for (const key in struct) {
    if (typeof struct[key] === 'string') {
      const filePath = path.join(dir, key);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, struct[key]);
        console.log("Created " + filePath);
      }
    } else {
      const targetDir = path.join(dir, key);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log("Created directory " + targetDir);
      }
      createFiles(targetDir, struct[key]);
    }
  }
}

if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
createFiles(baseDir, structure);

// Generate seed file
const seedContent = "const { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();\n\nasync function main() {\n  console.log('Seeding data...');\n}\n\nmain().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });";
fs.writeFileSync(path.join(baseDir, 'prisma', 'seed.js'), seedContent);
console.log('Done generating scaffold.');
