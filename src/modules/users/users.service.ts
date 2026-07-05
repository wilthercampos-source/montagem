import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/hash";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { InfoCliente } from "@/lib/requestInfo";
import { CriarUsuarioInput, AtualizarUsuarioInput } from "./users.validation";

const SELECT_PUBLICO = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  departamento: true,
  fotoUrl: true,
  status: true,
  createdAt: true,
} as const;

export async function listarUsuarios(empresaId: string) {
  return prisma.usuario.findMany({
    where: { empresaId },
    select: SELECT_PUBLICO,
    orderBy: { createdAt: "desc" },
  });
}

export async function criarUsuario(
  empresaId: string,
  criadoPorId: string,
  input: CriarUsuarioInput,
  cliente: InfoCliente
) {
  const existente = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (existente) {
    throw new ErroAplicacao("Já existe um usuário com este e-mail.", 409);
  }

  const senhaHash = await hashSenha(input.senha);

  const usuario = await prisma.usuario.create({
    data: {
      empresaId,
      nome: input.nome,
      email: input.email,
      senhaHash,
      perfil: input.perfil,
      departamento: input.departamento,
    },
    select: SELECT_PUBLICO,
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: criadoPorId,
    acao: "USUARIO_CRIADO",
    detalhes: { usuarioCriado: usuario.email, perfil: usuario.perfil },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return usuario;
}

export async function atualizarUsuario(
  empresaId: string,
  usuarioAlvoId: string,
  atualizadoPorId: string,
  input: AtualizarUsuarioInput,
  cliente: InfoCliente
) {
  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioAlvoId, empresaId } });
  if (!usuario) {
    throw new ErroAplicacao("Usuário não encontrado.", 404);
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuarioAlvoId },
    data: input,
    select: SELECT_PUBLICO,
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: atualizadoPorId,
    acao: "USUARIO_ATUALIZADO",
    detalhes: { usuarioAlvo: usuario.email, alteracoes: input },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return atualizado;
}

export async function excluirUsuario(
  empresaId: string,
  usuarioAlvoId: string,
  excluidoPorId: string,
  cliente: InfoCliente
) {
  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioAlvoId, empresaId } });
  if (!usuario) {
    throw new ErroAplicacao("Usuário não encontrado.", 404);
  }
  if (usuario.perfil === "USUARIO_MASTER") {
    const totalMasters = await prisma.usuario.count({ where: { empresaId, perfil: "USUARIO_MASTER" } });
    if (totalMasters <= 1) {
      throw new ErroAplicacao("Não é possível excluir o único Usuário Master da empresa.", 400);
    }
  }

  await prisma.usuario.delete({ where: { id: usuarioAlvoId } });

  await registrarAuditoria({
    empresaId,
    usuarioId: excluidoPorId,
    acao: "USUARIO_EXCLUIDO",
    detalhes: { usuarioExcluido: usuario.email },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });
}
