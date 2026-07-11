require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a Panchayat
  const panchayat = await prisma.panchayat.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Rampur Gram Panchayat',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      address: 'Near NH-28, Lucknow',
    },
  });
  console.log(`✅ Created Panchayat: ${panchayat.name}`);

  // 2. Create a Village linked to the Panchayat
  const village = await prisma.village.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Rampur',
      panchayatId: panchayat.id,
    },
  });
  console.log(`✅ Created Village: ${village.name}`);

  // 3. Create a basic Scheme
  const scheme = await prisma.scheme.upsert({
    where: { id: 1 },
    update: {},
    create: {
      schemeName: 'PM Kisan Samman Nidhi',
      description: 'Direct income support to farmers',
      benefit: '₹6000 per year in 3 instalments',
      department: 'Agriculture',
    },
  });
  console.log(`✅ Created Scheme: ${scheme.schemeName}`);

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });