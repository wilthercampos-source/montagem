import { Router } from "express";
import rateLimit from "express-rate-limit";
import { criarContaController, loginController } from "./auth.controller";

const router = Router();

// Camada extra de proteção contra força bruta, além do bloqueio por usuário.
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde um instante." },
});

router.post("/criar-conta", criarContaController);
router.post("/login", loginRateLimiter, loginController);

export default router;
