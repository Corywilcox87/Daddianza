const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  // Create super admin tenant
  const superTenant = await prisma.tenant.upsert({
    where: { slug: 'daddianza' },
    update: {},
    create: {
      name: 'Daddianza CRM',
      slug: 'daddianza',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      maxUsers: 999,
      maxCats: 9999,
    },
  });

  // Create super admin user
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: superTenant.id, email: 'admin@daddianza.com' } },
    update: {},
    create: {
      tenantId: superTenant.id,
      email: 'admin@daddianza.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // Create demo exhibitor tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-cattery' },
    update: {},
    create: {
      name: 'Silvermist Cattery',
      slug: 'demo-cattery',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      maxUsers: 10,
      maxCats: 200,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'owner@silvermist.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'owner@silvermist.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Silvermist',
      role: 'ADMIN',
    },
  });

  // Create sample shows
  const shows = [
    {
      name: 'Heartland CFA All-Breed Show',
      cfaShowNumber: 'CFA-2026-001',
      showDate: new Date('2026-06-14'),
      showEndDate: new Date('2026-06-15'),
      entryDeadline: new Date('2026-05-30'),
      city: 'Kansas City',
      state: 'MO',
      venue: 'Kansas City Convention Center',
      clubName: 'Heartland Cat Club',
      masterClerk: 'Bob Clerk',
      ringCount: 6,
      status: 'ENTRIES_OPEN',
      showType: 'ALLBREED',
      entryFee: 95.00,
      isPublic: true,
    },
    {
      name: 'Great Lakes Specialty Show',
      cfaShowNumber: 'CFA-2026-002',
      showDate: new Date('2026-07-12'),
      city: 'Chicago',
      state: 'IL',
      venue: 'Rosemont Convention Center',
      clubName: 'Great Lakes Cat Fanciers',
      ringCount: 4,
      status: 'UPCOMING',
      showType: 'SPECIALTY',
      entryFee: 85.00,
      isPublic: true,
    },
    {
      name: 'Pacific Rim International Show',
      cfaShowNumber: 'CFA-2026-003',
      showDate: new Date('2026-08-08'),
      city: 'Seattle',
      state: 'WA',
      venue: 'Seattle Center',
      clubName: 'Pacific Rim Cat Association',
      ringCount: 8,
      status: 'UPCOMING',
      showType: 'ALLBREED',
      entryFee: 110.00,
      isPublic: true,
    },
  ];

  for (const show of shows) {
    await prisma.show.upsert({
      where: { id: show.cfaShowNumber || show.name },
      update: {},
      create: { ...show, tenantId: superTenant.id },
    }).catch(async () => {
      const existing = await prisma.show.findFirst({ where: { cfaShowNumber: show.cfaShowNumber } });
      if (!existing) {
        await prisma.show.create({ data: { ...show, tenantId: superTenant.id } });
      }
    });
  }

  // Create sample CFA breeds list for reference
  console.log('Seed complete.');
  console.log('\nAdmin credentials:');
  console.log('  URL: http://localhost:3000');
  console.log('  Email: admin@daddianza.com');
  console.log('  Password: Admin@123456');
  console.log('\nDemo tenant credentials:');
  console.log('  Email: owner@silvermist.com');
  console.log('  Password: Admin@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
