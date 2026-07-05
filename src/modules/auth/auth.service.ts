import { prisma } from "@/lib/prisma";
import { hashSenha, compararSenha } from "@/lib/hash";
import { assinarToken } from "@/lib/jwt";
import { ErroAplicacao } from "@/middlewares/error.middleware";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { notificarUsuarioMaster } from "./notifications.service";
import { InfoCliente } from "@/lib/requestInfo";
import { CriarContaInput, LoginInput } from "./auth.validation";

/**
 * Cria a Empresa (tenant) e o primeiro Usuário, que se torna
 * automaticamente o Usuário Master, conforme especificação.
 */
export async function criarConta(input: CriarContaInput, cliente: InfoCliente) {
  const existente = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (existente) {
    throw new ErroAplicacao("Já existe uma conta cadastrada com este e-mail.", 409);
  }

  const senhaHash = await hashSenha(input.senha);

  const { empresa, usuario } = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: { nome: input.empresa },
    });

    const usuario = await tx.usuario.create({
      data: {
        empresaId: empresa.id,
        nome: input.nome,
        email: input.email,
        senhaHash,
        perfil: "USUARIO_MASTER",
        status: "ATIVO",
      },
    });

    return { empresa, usuario };
  });

  await registrarAuditoria({
    empresaId: empresa.id,
    usuarioId: usuario.id,
    acao: "USUARIO_CRIADO",
    detalhes: { origem: "criacao_de_conta", perfil: usuario.perfil },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  const token = assinarToken({ usuarioId: usuario.id, empresaId: empresa.id, perfil: usuario.perfil });

  return {
    token,
    usuario: sanitizarUsuario(usuario),
    empresa,
  };
}

/**
 * Autentica um usuário, aplicando a política de bloqueio:
 *  - 3 tentativas incorretas consecutivas bloqueiam o login por N segundos
 *    (N configurável por empresa, padrão 10s).
 *  - Se o usuário errar novamente após o desbloqueio, o Usuário Master
 *    da empresa é notificado automaticamente.
 * Toda tentativa (sucesso ou falha) é persistida para auditoria.
 */
export async function login(input: LoginInput, cliente: InfoCliente) {
  const usuario = await prisma.usuario.findUnique({ where: { email: input.email } });

  // E-mail não encontrado: registra a tentativa mas não revela se o e-mail existe.
  if (!usuario) {
    await prisma.tentativaLogin.create({
      data: {
        emailUsado: input.email,
        sucesso: false,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
        sistemaOperacional: cliente.sistemaOperacional,
        navegador: cliente.navegador,
      },
    });
    throw new ErroAplicacao("Credenciais inválidas.", 401);
  }

  const empresa = await prisma.empresa.findUniqueOrThrow({ where: { id: usuario.empresaId } });

  // Usuário está com o login temporariamente bloqueado.
  if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
    const restanteMs = usuario.bloqueadoAte.getTime() - Date.now();
    throw new ErroAplicacao(
      `Login bloqueado. Tente novamente em ${Math.ceil(restanteMs / 1000)} segundo(s).`,
      423
    );
  }

  const senhaValida = await compararSenha(input.senha, usuario.senhaHash);

  await prisma.tentativaLogin.create({
    data: {
      usuarioId: usuario.id,
      emailUsado: input.email,
      sucesso: senhaValida,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
      sistemaOperacional: cliente.sistemaOperacional,
      navegador: cliente.navegador,
    },
  });

  if (senhaValida) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });

    await registrarAuditoria({
      empresaId: empresa.id,
      usuarioId: usuario.id,
      acao: "LOGIN",
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    });

    const token = assinarToken({ usuarioId: usuario.id, empresaId: empresa.id, perfil: usuario.perfil });
    return { token, usuario: sanitizarUsuario(usuario) };
  }

  // --- Senha incorreta: aplica a política de bloqueio ---
  const tentativasFalhas = usuario.tentativasFalhas + 1;
  const maxTentativas = empresa.loginMaxTentativas;
  const deveBloquear = tentativasFalhas >= maxTentativas;
  const ehTentativaAposBloqueioAnterior = tentativasFalhas > maxTentativas;

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tentativasFalhas,
      bloqueadoAte: deveBloquear
        ? new Date(Date.now() + empresa.loginBloqueioSeg * 1000)
        : usuario.bloqueadoAte,
    },
  });

  await registrarAuditoria({
    empresaId: empresa.id,
    usuarioId: usuario.id,
    acao: deveBloquear ? "LOGIN_BLOQUEADO" : "LOGIN_FALHO",
    detalhes: { tentativasFalhas },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  if (ehTentativaAposBloqueioAnterior) {
    await notificarUsuarioMaster(empresa.id, {
      usuarioAlvo: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
      sistemaOperacional: cliente.sistemaOperacional,
      navegador: cliente.navegador,
      dataHora: new Date(),
    });
  }

  if (deveBloquear) {
    throw new ErroAplicacao(
      `Login bloqueado por ${empresa.loginBloqueioSeg} segundos após ${maxTentativas} tentativas incorretas.`,
      423
    );
  }

  throw new ErroAplicacao("Credenciais inválidas.", 401);
}

function sanitizarUsuario(usuario: { senhaHash?: string; [key: string]: unknown }) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}
