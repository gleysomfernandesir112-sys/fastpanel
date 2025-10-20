// Importe as ferramentas necessárias
// Usamos o caminho que descobrimos que funciona no seu projeto
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

// --- Configuração ---
const USER_TO_UPDATE = 'Andre2056';
const NEW_PASSWORD = 'Andre2056!'; // A senha que você pediu
// --------------------

const prisma = new PrismaClient();

async function main() {
  console.log(`Iniciando a troca de senha para o usuário: ${USER_TO_UPDATE}...`);

  try {
    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('Nova senha criptografada.');

    // Atualiza o usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: {
        username: USER_TO_UPDATE,
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log('--- SUCESSO! ---');
    console.log('Senha atualizada para o usuário:');
    console.log(updatedUser);
  } catch (e) {
    console.error('--- ERRO! ---');
    if (e.code === 'P2025') { // Código do Prisma para "Não encontrado"
      console.error(`Erro: Usuário "${USER_TO_UPDATE}" não foi encontrado no banco de dados.`);
    } else {
      console.error(e.message);
    }
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
