const { PrismaClient, Role } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = 'Andre2056';
  const plainPassword = 'Andre2056!';

  console.log(`Resetting password for ${username}...`);

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { username: username },
    update: {
      password: hashedPassword,
    },
    create: {
      username: username,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`Successfully created or updated SUPER_ADMIN user: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
