const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { ethers } = require("ethers");
const blockchainService = require("../services/blockchainService");
const certificateService = require("../services/certificateService");

const router = express.Router();

// Configuração do Multer (armazenamento em memória para cálculo de hash seguro)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
});

/**
 * POST /api/documents/calculate-hash
 * Recebe um arquivo e calcula seu hash SHA-256 e Keccak256 no backend
 */
router.post("/calculate-hash", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const sha256Hash = "0x" + crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const keccakHash = ethers.keccak256(req.file.buffer);

    return res.json({
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      sha256Hash: sha256Hash,
      keccakHash: keccakHash,
    });
  } catch (err) {
    console.error("Erro ao calcular hash:", err);
    return res.status(500).json({ error: "Falha ao processar arquivo" });
  }
});

/**
 * GET /api/documents
 * Retorna todos os documentos registrados no contrato
 */
router.get("/", async (req, res) => {
  try {
    const docs = await blockchainService.getAllDocuments();
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/:hash
 * Consulta e valida um documento pelo hash
 */
router.get("/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const doc = await blockchainService.getDocument(hash);
    if (!doc) {
      return res.status(404).json({ exists: false, message: "Documento não registrado na Blockchain" });
    }
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/:hash/certificate
 * Gera e realiza o download da Certidão Notarial em PDF
 */
router.get("/:hash/certificate", async (req, res) => {
  try {
    const { hash } = req.params;
    const doc = await blockchainService.getDocument(hash);

    if (!doc || !doc.exists) {
      return res.status(404).json({ error: "Documento não encontrado na Blockchain para emissão de certidão." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Certidao_Notarial_${hash.substring(0, 10)}.pdf"`
    );

    certificateService.generateCertificate(doc, res);
  } catch (err) {
    console.error("Erro ao gerar certidão:", err);
    return res.status(500).json({ error: "Erro ao gerar PDF da certidão" });
  }
});

/**
 * GET /api/blockchain/status
 * Métricas de saúde do nó Ethereum/Ganache
 */
router.get("/blockchain/status", async (req, res) => {
  try {
    const status = await blockchainService.getNetworkStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/blockchain/blocks
 * Retorna os blocos mais recentes minerados
 */
router.get("/blockchain/blocks", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "10", 10);
    const blocks = await blockchainService.getRecentBlocks(limit);
    return res.json(blocks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
