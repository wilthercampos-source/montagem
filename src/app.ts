import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "@/modules/auth/auth.routes";
import usersRoutes from "@/modules/users/users.routes";
import settingsRoutes from "@/modules/settings/settings.routes";
import auditRoutes from "@/modules/audit/audit.routes";
import importsRoutes from "@/modules/imports/imports.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import alertsRoutes from "@/modules/alerts/alerts.routes";
import intelligenceRoutes from "@/modules/intelligence/intelligence.routes";
import timelineRoutes from "@/modules/timeline/timeline.routes";
import replayRoutes from "@/modules/replay/replay.routes";
import tvRoutes from "@/modules/tv/tv.routes";
import reportsRoutes from "@/modules/reports/reports.routes";
import simulationsRoutes from "@/modules/simulations/simulations.routes";
import integrationsRoutes from "@/modules/integrations/integrations.routes";
import montaAiRoutes from "@/modules/montaai/montaai.routes";
import { tratarErros } from "@/middlewares/error.middleware";

export function criarApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*", credentials: true }));
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => res.json({ status: "ok", servico: "montaview-enterprise-api" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/usuarios", usersRoutes);
  app.use("/api/configuracoes", settingsRoutes);
  app.use("/api/auditoria", auditRoutes);
  app.use("/api/importacoes", importsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/alertas", alertsRoutes);
  app.use("/api/inteligencia", intelligenceRoutes);
  app.use("/api/timeline", timelineRoutes);
  app.use("/api/replay", replayRoutes);
  app.use("/api/painel-tv", tvRoutes);
  app.use("/api/relatorios", reportsRoutes);
  app.use("/api/simulacoes", simulationsRoutes);
  app.use("/api/integracoes", integrationsRoutes);
  app.use("/api/monta-ai", montaAiRoutes);

  app.use((_req, res) => res.status(404).json({ erro: "Rota não encontrada." }));
  app.use(tratarErros);

  return app;
}
