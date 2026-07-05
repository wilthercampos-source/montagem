import "dotenv/config";
import { criarApp } from "./app";

const PORT = Number(process.env.PORT) || 3333;

const app = criarApp();

app.listen(PORT, () => {
  console.log(`🚚 MontaView Enterprise API rodando em http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
