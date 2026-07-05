import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/modules/audit/audit.service";
import { InfoCliente } from "@/lib/requestInfo";
import {
  AtualizarEmpresaInput,
  AtualizarAparenciaInput,
  AtualizarSegurancaInput,
} from "./settings.validation";

export async function obterConfiguracoes(empresaId: string) {
  const empresa = await prisma.empresa.findUniqueOrThrow({ where: { id: empresaId } });
  return empresa;
}

async function atualizarEAuditar(
  empresaId: string,
  usuarioId: string,
  data: Record<string, unknown>,
  cliente: InfoCliente
) {
  const atualizada = await prisma.empresa.update({ where: { id: empresaId }, data });

  await registrarAuditoria({
    empresaId,
    usuarioId,
    acao: "CONFIGURACAO_ALTERADA",
    detalhes: { campos: Object.keys(data) },
    ip: cliente.ip,
    userAgent: cliente.userAgent,
  });

  return atualizada;
}

export function atualizarEmpresa(
  empresaId: string,
  usuarioId: string,
  input: AtualizarEmpresaInput,
  cliente: InfoCliente
) {
  return atualizarEAuditar(empresaId, usuarioId, input, cliente);
}

export function atualizarAparencia(
  empresaId: string,
  usuarioId: string,
  input: AtualizarAparenciaInput,
  cliente: InfoCliente
) {
  return atualizarEAuditar(empresaId, usuarioId, input, cliente);
}

export function atualizarSeguranca(
  empresaId: string,
  usuarioId: string,
  input: AtualizarSegurancaInput,
  cliente: InfoCliente
) {
  return atualizarEAuditar(empresaId, usuarioId, input, cliente);
}
