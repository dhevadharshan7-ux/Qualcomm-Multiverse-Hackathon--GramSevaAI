const { PrismaClient } = require('@prisma/client');
const { prismaFirebaseExtension } = require('../firebase/sync/databaseToFirebase');

const prisma = new PrismaClient().$extends(prismaFirebaseExtension);

module.exports = prisma;