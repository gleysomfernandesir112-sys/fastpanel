// Importe as ferramentas necessárias
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

// --- CONFIGURE SEU ADMIN AQUI ---
const ADMIN_USERNAME = 'Andre2056'; // Escolha seu nome de usuário
const ADMIN_PASSWORD = 'Andre2056!'; // Escolha uma senha forte!
// ---------------------------------

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando a criação do SUPER_ADMIN...');

  // Criptografa a senha
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  console.log('Senha criptografada.');

  // Cria o usuário no banco de dados
  try {
    const adminUser = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        // --- CORRIGIDO COM A SUA INFORMAÇÃO ---
        role: 'SUPER_ADMIN' 
      },
    });
    console.log('--- SUCESSO! ---');
    console.log('Super Admin criado:');
    console.log(adminUser);
  } catch (e) {
    console.error('--- ERRO! ---');
    console.error('Não foi possível criar o admin. O usuário já existe?');
    console.error(e.message);
  }
}

// Executa o script e fecha a conexão
main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
