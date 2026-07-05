import { PerfilUsuario } from "@prisma/client";

/**
 * Hierarquia simples de permissões por perfil.
 * Cada perfil herda as permissões dos perfis abaixo dele.
 * Sprint 02+ deve evoluir isso para permissões individuais
 * (granulares por módulo/ação), conforme especificado no
 * módulo "Usuários > Permissões individuais".
 */
const HIERARQUIA: Record<PerfilUsuario, number> = {
  OPERADOR: 1,
  ANALISTA: 2,
  GESTOR: 3,
  USUARIO_MASTER: 4,
};

export function possuiNivelMinimo(perfil: PerfilUsuario, minimo: PerfilUsuario): boolean {
  return HIERARQUIA[perfil] >= HIERARQUIA[minimo];
}

export function ehMaster(perfil: PerfilUsuario): boolean {
  return perfil === "USUARIO_MASTER";
}
