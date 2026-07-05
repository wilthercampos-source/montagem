import { Request, Response, NextFunction } from "express";
import { PerfilUsuario } from "@prisma/client";
import { verificarToken } from "@/lib/jwt";
import { possuiNivelMinimo } from "@/utils/permissoes";

export interface RequestAutenticado extends Request {
  usuario?: {
    usuarioId: string;
    empresaId: string;
    perfil: PerfilUsuario;
  };
}

export function autenticar(req: RequestAutenticado, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de acesso não informado." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verificarToken(token);
    req.usuario = {
      usuarioId: payload.usuarioId,
      empresaId: payload.empresaId,
      perfil: payload.perfil as PerfilUsuario,
    };
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

export function exigirPerfil(minimo: PerfilUsuario) {
  return (req: RequestAutenticado, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Não autenticado." });
    }
    if (!possuiNivelMinimo(req.usuario.perfil, minimo)) {
      return res.status(403).json({ erro: "Você não tem permissão para executar esta ação." });
    }
    next();
  };
}
