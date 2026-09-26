const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../config/contractConfig.json");

class BlockchainService {
  constructor() {
    this.rpcUrls = [
      process.env.GANACHE_URL || "http://127.0.0.1:7545", // Ganache GUI
      "http://127.0.0.1:8545",                          // Ganache CLI / local node
    ];
    this.provider = null;
    this.activeRpcUrl = null;
  }

  async getProvider() {
    if (this.provider) {
      try {
        await this.provider.getBlockNumber();
        return this.provider;
      } catch (e) {
        // Se a conexão falhar, tenta reconectar
        this.provider = null;
      }
    }

    for (const url of this.rpcUrls) {
      try {
        const testProvider = new ethers.JsonRpcProvider(url);
        await testProvider.getBlockNumber();
        this.provider = testProvider;
        this.activeRpcUrl = url;
        console.log(`[BlockchainService] Conectado com sucesso ao nó Ethereum: ${url}`);
        return this.provider;
      } catch (err) {
        // Tenta próxima URL
      }
    }

    // Se nenhum estiver rodando ainda, usa o primeiro como fallback
    this.provider = new ethers.JsonRpcProvider(this.rpcUrls[0]);
    this.activeRpcUrl = this.rpcUrls[0];
    return this.provider;
  }

  getContractConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    try {
      const data = fs.readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(data);
    } catch (e) {
      console.error("[BlockchainService] Erro ao carregar contractConfig.json:", e.message);
      return null;
    }
  }

  async getContract() {
    const config = this.getContractConfig();
    if (!config || !config.contractAddress || !config.abi) {
      throw new Error("Smart Contract ainda não foi implantado. Execute 'npm run deploy:ganache'.");
    }

    const provider = await this.getProvider();
    return new ethers.Contract(config.contractAddress, config.abi, provider);
  }

  async getNetworkStatus() {
    try {
      const provider = await this.getProvider();
      const blockNumber = await provider.getBlockNumber();
      const feeData = await provider.getFeeData();
      const network = await provider.getNetwork();

      let accounts = [];
      try {
        const signers = await provider.listAccounts();
        accounts = signers.slice(0, 5).map((s) => s.address);
      } catch (e) {
        // Provedor pode não suportar listAccounts diretamente
      }

      return {
        online: true,
        rpcUrl: this.activeRpcUrl,
        chainId: Number(network.chainId),
        blockNumber: blockNumber,
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A",
        contractConfigured: !!this.getContractConfig(),
        contractAddress: this.getContractConfig()?.contractAddress || null,
        accounts: accounts,
      };
    } catch (err) {
      return {
        online: false,
        error: "Nó Ganache indisponível em " + this.rpcUrls.join(" ou "),
        contractConfigured: !!this.getContractConfig(),
      };
    }
  }

  async getRecentBlocks(limit = 10) {
    try {
      const provider = await this.getProvider();
      const currentBlock = await provider.getBlockNumber();
      const blocks = [];

      const start = Math.max(0, currentBlock - limit + 1);
      for (let i = currentBlock; i >= start; i--) {
        const block = await provider.getBlock(i);
        if (block) {
          blocks.push({
            number: block.number,
            hash: block.hash,
            parentHash: block.parentHash,
            timestamp: block.timestamp,
            date: new Date(block.timestamp * 1000).toLocaleString("pt-BR"),
            transactionsCount: block.transactions ? block.transactions.length : 0,
            gasUsed: block.gasUsed ? block.gasUsed.toString() : "0",
            miner: block.miner,
          });
        }
      }
      return blocks;
    } catch (err) {
      console.error("[BlockchainService] Erro ao buscar blocos recentes:", err.message);
      return [];
    }
  }

  async getDocument(hash) {
    const contract = await this.getContract();
    const doc = await contract.verifyDocument(hash);
    if (!doc.exists) {
      return null;
    }

    return {
      hash: hash,
      exists: doc.exists,
      isValid: doc.isValid,
      title: doc.title,
      documentType: doc.documentType,
      description: doc.description,
      owner: doc.owner,
      registeredAt: Number(doc.registeredAt),
      registeredDate: new Date(Number(doc.registeredAt) * 1000).toLocaleString("pt-BR"),
      revocationReason: doc.revocationReason,
      revokedAt: Number(doc.revokedAt),
      revokedDate: doc.revokedAt > 0 ? new Date(Number(doc.revokedAt) * 1000).toLocaleString("pt-BR") : null,
    };
  }

  async getAllDocuments() {
    try {
      const contract = await this.getContract();
      const hashes = await contract.getAllDocumentHashes();
      const documents = [];

      for (const h of hashes) {
        const d = await this.getDocument(h);
        if (d) documents.push(d);
      }
      return documents;
    } catch (err) {
      console.error("[BlockchainService] Erro ao buscar todos os documentos:", err.message);
      return [];
    }
  }
}

module.exports = new BlockchainService();
