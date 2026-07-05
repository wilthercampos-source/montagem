import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

export interface TokenPayload {
  usuarioId: string;
  empresaId: string;
  perfil: string;
}

export function assinarToken(payload: TokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado. Verifique o arquivo .env");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
