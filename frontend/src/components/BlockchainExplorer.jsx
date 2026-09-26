import React, { useState, useEffect } from "react";
import { Activity, Layers, FileText, CheckCircle, ShieldAlert, RotateCw, Database, Terminal } from "lucide-react";
import { truncateHash, truncateAddress } from "../utils/cryptoUtils";

export default function BlockchainExplorer() {
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("documents"); // 'documents' ou 'blocks'

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Status da rede
      const resStats = await fetch("/api/documents/blockchain/status");
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }

      // 2. Blocos recentes
      const resBlocks = await fetch("/api/documents/blockchain/blocks?limit=8");
      if (resBlocks.ok) {
        const dataBlocks = await resBlocks.json();
        setBlocks(dataBlocks);
      }

      // 3. Documentos registrados
      const resDocs = await fetch("/api/documents");
      if (resDocs.ok) {
        const dataDocs = await resDocs.json();
        setDocuments(dataDocs);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do explorador:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in space-y-10">
      {/* Cabeçalho Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EAEAEA] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#787774]">
            <span>Auditoria Pública</span>
            <span>/</span>
            <span>Livro Razão Ganache</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#111111]">
            Explorador da Rede Notarial
          </h1>
          <p className="text-xs sm:text-sm text-[#787774] max-w-2xl leading-relaxed">
            Acompanhe em tempo real o estado do livro contábil descentralizado: blocos minerados, taxas de consumo e registros notariais imutáveis.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-secondary self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Grid Bento de Métricas da Rede (4 Colunas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status Ganache */}
        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center justify-between text-[#787774] text-xs">
            <span className="font-mono text-[11px] uppercase">Rede Local</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.online ? "bg-[#346538]" : "bg-[#9F2F2D]"
                }`}
              ></span>
              <span className="text-[11px] font-mono text-[#111111]">
                {stats?.online ? "Ativo" : "Inativo"}
              </span>
            </span>
          </div>
          <p className="font-serif text-xl font-semibold text-[#111111]">
            Ganache Local
          </p>
          <p className="text-[11px] font-mono text-[#787774] truncate">
            {stats?.rpcUrl || "127.0.0.1:7545"}
          </p>
        </div>

        {/* Card 2: Altura do Bloco */}
        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center justify-between text-[#787774] text-xs">
            <span className="font-mono text-[11px] uppercase">Altura do Bloco</span>
            <Layers className="w-3.5 h-3.5 text-[#787774]" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-2xl font-semibold text-[#111111]">
            #{stats?.blockNumber ?? 0}
          </p>
          <p className="text-[11px] font-mono text-[#787774]">
            Chain ID: {stats?.chainId || 1337}
          </p>
        </div>

        {/* Card 3: Total de Registros */}
        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center justify-between text-[#787774] text-xs">
            <span className="font-mono text-[11px] uppercase">Documentos Ativos</span>
            <FileText className="w-3.5 h-3.5 text-[#787774]" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-2xl font-semibold text-[#111111]">
            {documents.length}
          </p>
          <p className="text-[11px] text-[#787774]">
            No Smart Contract
          </p>
        </div>

        {/* Card 4: Contrato Notarial */}
        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center justify-between text-[#787774] text-xs">
            <span className="font-mono text-[11px] uppercase">Smart Contract</span>
            <Terminal className="w-3.5 h-3.5 text-[#787774]" strokeWidth={1.75} />
          </div>
          <p className="text-xs font-mono text-[#111111] break-all font-medium">
            {stats?.contractAddress ? truncateAddress(stats.contractAddress) : "Não implantado"}
          </p>
          <p className="text-[11px] text-[#787774]">
            Solidity 0.8.24 (EVM)
          </p>
        </div>
      </div>

      {/* Navegação entre Documentos e Blocos */}
      <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-4">
        <button
          onClick={() => setActiveSubTab("documents")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeSubTab === "documents"
              ? "bg-[#111111] text-white"
              : "text-[#787774] hover:text-[#111111]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          Livro de Registros Notariais ({documents.length})
        </button>

        <button
          onClick={() => setActiveSubTab("blocks")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeSubTab === "blocks"
              ? "bg-[#111111] text-white"
              : "text-[#787774] hover:text-[#111111]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
          Blocos Recentes ({blocks.length})
        </button>
      </div>

      {/* Conteúdo: Tabela do Livro Notarial */}
      {activeSubTab === "documents" && (
        <div className="bento-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FBFBFA]">
            <h3 className="font-serif text-sm font-semibold text-[#111111]">
              Registros Notariais On-Chain
            </h3>
            <span className="text-[11px] text-[#787774]">
              Histórico público de fé notarial
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-[#787774] text-xs space-y-2">
              <FileText className="w-6 h-6 mx-auto text-[#A0A09E]" strokeWidth={1.75} />
              <p className="font-medium text-[#111111]">Nenhum registro gravado até o momento.</p>
              <p className="text-[11px]">Utilize a aba "Registrar" para efetuar a primeira gravação na blockchain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F6F3] text-[11px] font-mono uppercase tracking-wider text-[#787774] border-b border-[#EAEAEA]">
                  <tr>
                    <th className="px-6 py-3 font-medium">Documento / Categoria</th>
                    <th className="px-6 py-3 font-medium">Hash Criptográfico</th>
                    <th className="px-6 py-3 font-medium">Data do Registro</th>
                    <th className="px-6 py-3 font-medium">Titular (Owner)</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {documents.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#111111]">{doc.title}</p>
                        <span className="text-[10px] font-mono text-[#787774] inline-block mt-0.5">
                          {doc.documentType}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-[#2F3437]">
                        <span title={doc.hash} className="bg-[#F7F6F3] px-2 py-1 rounded border border-[#EAEAEA]">
                          {truncateHash(doc.hash)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[11px] text-[#787774]">
                        {doc.registeredDate}
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-[#787774]">
                        <span title={doc.owner}>{truncateAddress(doc.owner)}</span>
                      </td>

                      <td className="px-6 py-4">
                        {doc.isValid ? (
                          <span className="badge-valid">
                            <CheckCircle className="w-3 h-3" strokeWidth={2} /> Válido
                          </span>
                        ) : (
                          <span className="badge-revoked">
                            <ShieldAlert className="w-3 h-3" strokeWidth={2} /> Revogado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Blocos Minerados */}
      {activeSubTab === "blocks" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {blocks.length === 0 ? (
            <div className="col-span-2 bento-card p-12 text-center text-[#787774] text-xs space-y-2">
              <Layers className="w-6 h-6 mx-auto text-[#A0A09E]" strokeWidth={1.75} />
              <p className="font-medium text-[#111111]">Nenhum bloco carregado da rede local.</p>
              <p className="text-[11px]">Verifique se o Ganache está em execução em http://127.0.0.1:7545.</p>
            </div>
          ) : (
            blocks.map((blk) => (
              <div key={blk.number} className="bento-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
                  <div className="flex items-center gap-2">
                    <span className="keystroke font-bold text-xs">
                      Bloco #{blk.number}
                    </span>
                    <span className="text-[11px] text-[#787774]">{blk.date}</span>
                  </div>
                  <span className="badge-info text-[10px]">
                    {blk.transactionsCount} tx{blk.transactionsCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#787774]">
                    <span className="text-[11px] font-mono">Hash do Bloco:</span>
                    <span className="font-mono text-[11px] text-[#2F3437]">{truncateHash(blk.hash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#787774]">
                    <span className="text-[11px] font-mono">Gas Utilizado:</span>
                    <span className="font-mono text-[11px] text-[#2F3437]">{blk.gasUsed}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#787774]">
                    <span className="text-[11px] font-mono">Minerador:</span>
                    <span className="font-mono text-[11px] text-[#2F3437]">{truncateAddress(blk.miner)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
