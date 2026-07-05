import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("montaview", 12);

  const empresa = await prisma.empresa.create({
    data: {
      nome: "Transportadora Horizonte",
      unidade: "Matriz — Campinas/SP",
      idioma: "pt-BR",
      moeda: "BRL",
    },
  });

  await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: "Renata Souza",
      email: "renata.souza@montaview.com",
      senhaHash,
      perfil: "USUARIO_MASTER",
      departamento: "Operações",
      status: "ATIVO",
    },
  });

  console.log("Seed concluído. Login de teste: renata.souza@montaview.com / montaview");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
