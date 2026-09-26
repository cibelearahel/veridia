const express = require("express");
const cors = require("cors");
const path = require("path");
const notaryRoutes = require("./routes/notaryRoutes");
const blockchainService = require("./services/blockchainService");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use("/api/documents", notaryRoutes);

// Rota de Health Check
app.get("/health", async (req, res) => {
  const status = await blockchainService.getNetworkStatus();
  res.json({
    status: "online",
    service: "Cartório Notarial Distribuído Backend API",
    timestamp: new Date().toISOString(),
    blockchain: status,
  });
});

// Inicialização do Servidor
app.listen(PORT, async () => {
  console.log("==================================================");
  console.log(` Cartório Distribuído API rodando na porta: ${PORT}`);
  console.log(` Endpoint Base: http://localhost:${PORT}/api/documents`);
  console.log(` Health Check:  http://localhost:${PORT}/health`);
  console.log("==================================================");

  // Testa conexão com Ganache
  try {
    const status = await blockchainService.getNetworkStatus();
    if (status.online) {
      console.log(` Ganache Conectado: ${status.rpcUrl} (Bloco Atual: #${status.blockNumber})`);
      if (status.contractConfigured) {
        console.log(` Smart Contract Vinculado: ${status.contractAddress}`);
      } else {
        console.log(` ⚠️ Smart Contract ainda não implantado. Execute 'npm run deploy:ganache'.`);
      }
    } else {
      console.log(` ⚠️ Aviso: Ganache ainda não detectado em 7545 ou 8545.`);
    }
  } catch (err) {
    console.error("Erro ao verificar blockchain:", err.message);
  }
});

module.exports = app;
