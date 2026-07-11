const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./lib/csv');
const prisma = new PrismaClient();

// ─── Dev-only seeded officer credentials ─────────────────────────────────────
// NEVER reuse this password anywhere real. It exists purely so the hackathon
// demo has a working officer login out of the box. See backend/README.md and
// SECURITY_CHANGES.md for details.
const DEV_OFFICER_EMAIL = 'officer1@gramseva.dev';
const DEV_OFFICER_PASSWORD = 'dev-only-change-me';

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

  // 3. Import the real central-government scheme catalog (sourced from the
  // team's Firebase "schemes" collection, exported to prisma/data/schemes.csv).
  // Upserted by schemeName (unique) so re-seeding is idempotent and doesn't
  // duplicate. This replaces the old single hardcoded demo scheme — that
  // scheme (PM Kisan Samman Nidhi) is now covered by the CSV's "PM-KISAN"
  // entry instead.
  const csvPath = path.join(__dirname, 'data', 'schemes.csv');
  const csvRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  let importedCount = 0;
  for (const row of csvRows) {
    if (!row.schemeName || !row.schemeDescription) continue;
    await prisma.scheme.upsert({
      where: { schemeName: row.schemeName },
      update: {
        description: row.schemeDescription,
        schemeUrl: row.schemeUrl || null,
      },
      create: {
        schemeName: row.schemeName,
        description: row.schemeDescription,
        schemeUrl: row.schemeUrl || null,
      },
    });
    importedCount++;
  }
  console.log(`✅ Imported ${importedCount} schemes from prisma/data/schemes.csv`);

  // 4. Create a demo Officer with a working (dev-only) login
  const passwordHash = await bcrypt.hash(DEV_OFFICER_PASSWORD, 10);
  const officer = await prisma.officer.upsert({
    where: { email: DEV_OFFICER_EMAIL },
    update: { passwordHash },
    create: {
      name: 'Ramesh Kumar',
      email: DEV_OFFICER_EMAIL,
      phone: '9876543210',
      designation: 'Village Panchayat Officer',
      passwordHash,
      panchayatId: panchayat.id,
    },
  });
  console.log(`✅ Created Officer: ${officer.name}`);
  console.log(`   ↳ Dev login: POST /api/auth/officer/login { "email": "${DEV_OFFICER_EMAIL}", "password": "${DEV_OFFICER_PASSWORD}" }`);
  console.log('   ↳ This is a DEV-ONLY password. Change it before any real deployment.');

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