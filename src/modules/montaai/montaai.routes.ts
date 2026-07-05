import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { perguntarMontaAIController } from "./montaai.controller";

const router = Router();

router.use(autenticar);

router.post("/perguntar", perguntarMontaAIController);

export default router;
