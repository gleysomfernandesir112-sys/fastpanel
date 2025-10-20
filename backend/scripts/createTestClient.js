const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  // We need a reseller to create a client. Let's find the Super Admin to be the creator of the reseller.
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superAdmin) {
    console.error('Error: Super Admin not found. Please create one first via the UI.');
    return;
  }

  // Create a test Master Reseller if one doesn't exist
  let masterReseller = await prisma.user.findFirst({ where: { username: 'test_master' } });
  if (!masterReseller) {
    masterReseller = await prisma.user.create({
      data: {
        username: 'test_master',
        password: await bcrypt.hash('password', 10), // Hash password
        role: 'MASTER_RESELLER',
        createdById: superAdmin.id,
      },
    });
    console.log('Created test Master Reseller: test_master / password');
  }


  // Create a test Reseller if one doesn't exist
  let reseller = await prisma.user.findFirst({ where: { username: 'test_reseller' } });
  if (!reseller) {
    reseller = await prisma.user.create({
      data: {
        username: 'test_reseller',
        password: await bcrypt.hash('password', 10), // Hash password
        role: 'RESELLER',
        createdById: masterReseller.id,
      },
    });
    console.log('Created test Reseller: test_reseller / password');
  }

  // Check if the test client already exists
  let client = await prisma.client.findFirst({
    where: { username: 'test_client' },
  });

  if (client) {
    console.log('Test client "test_client" already exists.');
    // Optional: Update password if it's not hashed
    const isHashed = client.password.startsWith('$2a);
    if (!isHashed) {
        const hashedPassword = await bcrypt.hash('password', 10);
        client = await prisma.client.update({
            where: { id: client.id },
            data: { password: hashedPassword }
        });
        console.log('Updated test_client password to be hashed.');
    }

  } else {
    // Create a new test Client if it doesn't exist
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1); // Set expiration to 1 year from now
    const hashedPassword = await bcrypt.hash('password', 10);

    client = await prisma.client.create({
      data: {
        username: 'test_client',
        password: hashedPassword,
        m3uUrl: 'will_be_generated', // placeholder
        resellerId: reseller.id,
        expirationDate: expiration,
      },
    });
    console.log('\n--- New Test Client Created ---');
  }

  console.log('Client Username: test_client');
  console.log('Client Password: password');
  console.log('Client expires on:', client.expirationDate?.toISOString() || 'N/A');
  console.log('---------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });