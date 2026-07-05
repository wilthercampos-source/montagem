import { Router } from "express";
import multer from "multer";
import { autenticar, exigirPerfil } from "@/middlewares/auth.middleware";
import { uploadController, processarController, listarController } from "./imports.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const permitido = /\.(csv|txt)$/i.test(file.originalname);
    cb(permitido ? null : new Error("Formato de arquivo não suportado. Use .csv ou .txt."), permitido);
  },
});

const router = Router();

router.use(autenticar);

router.get("/", listarController);
router.post("/upload", exigirPerfil("ANALISTA"), upload.single("arquivo"), uploadController);
router.post("/:id/processar", exigirPerfil("ANALISTA"), processarController);

export default router;
