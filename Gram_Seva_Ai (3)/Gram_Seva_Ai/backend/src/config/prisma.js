const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { prismaFirebaseExtension } = require('../firebase/sync/databaseToFirebase');

const config = require('./env');

// Use the pg driver adapter — required for the WASM (Rust-free) engine,
// which is the only Prisma engine that runs on Windows ARM64 (Snapdragon X Elite).
const adapter = new PrismaPg({ connectionString: config.dbUrl });

const prisma = new PrismaClient({ adapter }).$extends(prismaFirebaseExtension);

module.exports = prisma;