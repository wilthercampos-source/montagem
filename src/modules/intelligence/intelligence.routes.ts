import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { perguntarController, dnaOperacionalController } from "./intelligence.controller";

const router = Router();

router.use(autenticar);

router.post("/perguntar", perguntarController);
router.get("/dna-operacional", dnaOperacionalController);

export default router;
