import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import defaultContractConfig from "../config/contractConfig.json";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnected, setIsConnected] = useState(false);
  const [contractConfig, setContractConfig] = useState(defaultContractConfig);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Recarrega se o deploy atualizar a API
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/documents/blockchain/status");
        const data = await res.json();
        if (data.contractConfigured && data.contractAddress) {
          setContractConfig((prev) => ({
            ...prev,
            contractAddress: data.contractAddress,
          }));
        }
      } catch (e) {
        // Fallback para defaultContractConfig
      }
    }
    loadConfig();
  }, []);

  // Atualiza o saldo da conta
  const refreshBalance = async (acc) => {
    if (!acc || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(acc);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Erro ao atualizar saldo:", err);
    }
  };

  // Conectar à MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask não encontrada! Por favor, instale a extensão MetaMask no seu navegador.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const userAcc = accounts[0];
        setAccount(userAcc);
        setChainId(Number(network.chainId));
        setIsConnected(true);
        await refreshBalance(userAcc);
      }
    } catch (err) {
      console.error("Erro ao conectar carteira:", err);
      setError(err.message || "Erro ao conectar carteira.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setBalance("0");
  };

  // Troca ou Adiciona automaticamente a rede Ganache na MetaMask com 1 clique
  const switchToGanacheNetwork = async () => {
    if (!window.ethereum) {
      alert("MetaMask não encontrada!");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x539" }], // 1337 em hexadecimal
      });
    } catch (switchError) {
      // 4902: a rede não existe na MetaMask ainda, então adicionamos
      if (switchError.code === 4902 || switchError.message?.includes("Unrecognized") || switchError.message?.includes("chain ID")) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x539",
                chainName: "Ganache Local",
                rpcUrls: ["http://127.0.0.1:7545"],
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error("Erro ao adicionar rede no MetaMask:", addError);
        }
      }
    }
  };

  // Obter instância do contrato conectado ao Signer do usuário
  const getSignerContract = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask não encontrada no navegador.");
    }

    const config = contractConfig || defaultContractConfig;
    if (!config || !config.contractAddress) {
      throw new Error("Endereço do contrato não configurado. Execute 'npm run deploy:ganache'.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    return new ethers.Contract(config.contractAddress, config.abi, signer);
  };

  // Obter instância do contrato somente leitura (sem precisar assinar)
  const getReadOnlyContract = async () => {
    if (!contractConfig || !contractConfig.contractAddress) {
      throw new Error("Contrato não configurado.");
    }

    // Tenta MetaMask se houver, senão usa RPC local direto
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(contractConfig.contractAddress, contractConfig.abi, provider);
    } else {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
      return new ethers.Contract(contractConfig.contractAddress, contractConfig.abi, provider);
    }
  };

  // Observa mudanças de conta ou rede na MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          refreshBalance(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        isConnected,
        isConnecting,
        error,
        contractConfig,
        connectWallet,
        disconnectWallet,
        switchToGanacheNetwork,
        getSignerContract,
        getReadOnlyContract,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
