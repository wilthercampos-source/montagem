import { Router } from "express";
import { autenticar } from "@/middlewares/auth.middleware";
import { simularController } from "./simulations.controller";

const router = Router();

router.use(autenticar);

router.post("/", simularController);

export default router;
