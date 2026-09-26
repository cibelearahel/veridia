import React, { useState } from "react";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";
import RegisterDocument from "./components/RegisterDocument";
import VerifyDocument from "./components/VerifyDocument";
import BlockchainExplorer from "./components/BlockchainExplorer";
import { Shield, Layers, Terminal } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState("register");

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBFA] text-[#111111]">
      {/* Barra de Navegação Superior */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Área Central de Conteúdo com Macro-whitespace */}
      <main className="flex-1 py-10 sm:py-16">
        {activeTab === "register" && <RegisterDocument />}
        {activeTab === "verify" && <VerifyDocument />}
        {activeTab === "explorer" && <BlockchainExplorer />}
      </main>

      {/* Colofão / Rodapé Editorial Notarial */}
      <footer className="border-t border-[#EAEAEA] bg-[#FBFBFA] py-10 text-xs text-[#787774]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#111111]" strokeWidth={1.75} />
                <span className="font-serif font-semibold text-base text-[#111111] tracking-tight">
                  Veridia
                </span>
                <span className="text-[10px] font-mono text-[#787774] border border-[#EAEAEA] px-1.5 py-0.5 rounded bg-white">
                  Cartório Distribuído • v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#787774] max-w-md">
                Infraestrutura Veridia de fé pública, carimbo temporal imutável e prova criptográfica de integridade notarial em rede descentralizada.
              </p>
            </div>

            {/* Metadados Técnicos de Execução */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#EAEAEA] font-mono text-[11px] text-[#2F3437]">
                <Layers className="w-3 h-3 text-[#787774]" strokeWidth={1.75} />
                Ganache Local (Chain 1337)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#EAEAEA] font-mono text-[11px] text-[#2F3437]">
                <Terminal className="w-3 h-3 text-[#787774]" strokeWidth={1.75} />
                Solidity 0.8.24
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
