import { Request } from "express";

export interface InfoCliente {
  ip: string;
  userAgent: string;
  sistemaOperacional: string;
  navegador: string;
}

/**
 * Extrai IP, User-Agent e uma identificação simples de SO/navegador
 * a partir do request, para uso em Auditoria e TentativaLogin.
 * Para um parsing mais robusto em produção, considerar a lib "ua-parser-js".
 */
export function extrairInfoCliente(req: Request): InfoCliente {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "desconhecido";

  const userAgent = req.headers["user-agent"] || "desconhecido";

  let sistemaOperacional = "Desconhecido";
  if (/windows/i.test(userAgent)) sistemaOperacional = "Windows";
  else if (/mac os/i.test(userAgent)) sistemaOperacional = "macOS";
  else if (/android/i.test(userAgent)) sistemaOperacional = "Android";
  else if (/iphone|ipad|ios/i.test(userAgent)) sistemaOperacional = "iOS";
  else if (/linux/i.test(userAgent)) sistemaOperacional = "Linux";

  let navegador = "Desconhecido";
  if (/edg/i.test(userAgent)) navegador = "Edge";
  else if (/chrome/i.test(userAgent)) navegador = "Chrome";
  else if (/firefox/i.test(userAgent)) navegador = "Firefox";
  else if (/safari/i.test(userAgent)) navegador = "Safari";

  return { ip, userAgent, sistemaOperacional, navegador };
}
