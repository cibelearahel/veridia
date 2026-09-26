import React from "react";
import { useWallet } from "../context/WalletContext";
import { truncateAddress } from "../utils/cryptoUtils";
import { Shield, FileCheck, Search, Activity, Wallet, ArrowRightLeft } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    account,
    chainId,
    balance,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToGanacheNetwork,
  } = useWallet();

  const isGanache = chainId === 1337 || chainId === 5777;

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-[#EAEAEA] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Marca Editorial */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab("register")}
          >
            <div className="w-9 h-9 rounded-lg bg-[#111111] text-white flex items-center justify-center transition-transform group-hover:scale-95">
              <Shield className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-semibold tracking-tight text-[#111111]">
                  Veridia
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-[#F7F6F3] text-[#787774] border border-[#EAEAEA] rounded-full">
                  Cartório Distribuído
                </span>
              </div>
              <p className="text-[11px] text-[#787774] hidden md:block">
                Fé pública e autenticação notarial em blockchain
              </p>
            </div>
          </div>

          {/* Navegação por Abas (Estilo Documento / Segmented Control) */}
          <nav className="hidden md:flex items-center bg-[#F7F6F3] border border-[#EAEAEA] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "register"
                  ? "bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  : "text-[#787774] hover:text-[#111111]"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              Registrar
            </button>

            <button
              onClick={() => setActiveTab("verify")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "verify"
                  ? "bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  : "text-[#787774] hover:text-[#111111]"
              }`}
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
              Verificar
            </button>

            <button
              onClick={() => setActiveTab("explorer")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "explorer"
                  ? "bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  : "text-[#787774] hover:text-[#111111]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
              Explorador
            </button>
          </nav>

          {/* Controles da Carteira & Rede Ganache */}
          <div className="flex items-center gap-2.5">
            {/* Indicador de Rede */}
            {isConnected ? (
              !isGanache ? (
                <button
                  onClick={switchToGanacheNetwork}
                  className="badge-warning hover:bg-[#F8EDCD] transition-colors cursor-pointer"
                  title="Clique para alternar para a rede Ganache"
                >
                  <ArrowRightLeft className="w-3 h-3" strokeWidth={2} />
                  Mudar p/ Ganache
                </button>
              ) : (
                <div className="badge-valid hidden sm:inline-flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#346538]"></span>
                  Ganache ({chainId})
                </div>
              )
            ) : (
              <div className="badge-neutral hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A0A09E]"></span>
                Ganache Local
              </div>
            )}

            {/* Painel da Carteira */}
            {isConnected ? (
              <div className="flex items-center gap-2 bg-white border border-[#EAEAEA] rounded-md px-3 py-1.5 text-xs">
                <div className="flex flex-col items-end leading-tight">
                  <span className="font-mono text-xs font-medium text-[#111111]">
                    {parseFloat(balance).toFixed(3)} ETH
                  </span>
                  <span className="font-mono text-[10px] text-[#787774]">
                    {truncateAddress(account)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  title="Desconectar Carteira"
                  className="text-[11px] text-[#787774] hover:text-[#9F2F2D] border-l border-[#EAEAEA] pl-2 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary"
              >
                <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
                {isConnecting ? "Conectando..." : "Conectar Carteira"}
              </button>
            )}
          </div>
        </div>

        {/* Abas Mobile */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#EAEAEA]">
          <button
            onClick={() => setActiveTab("register")}
            className={`text-xs flex items-center gap-1 px-3 py-1 rounded-md ${
              activeTab === "register"
                ? "bg-[#111111] text-white font-medium"
                : "text-[#787774]"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
            Registrar
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`text-xs flex items-center gap-1 px-3 py-1 rounded-md ${
              activeTab === "verify"
                ? "bg-[#111111] text-white font-medium"
                : "text-[#787774]"
            }`}
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
            Verificar
          </button>
          <button
            onClick={() => setActiveTab("explorer")}
            className={`text-xs flex items-center gap-1 px-3 py-1 rounded-md ${
              activeTab === "explorer"
                ? "bg-[#111111] text-white font-medium"
                : "text-[#787774]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
            Explorador
          </button>
        </div>
      </div>
    </header>
  );
}
