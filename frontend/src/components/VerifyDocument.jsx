import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { calculateFileSHA256, formatTimestamp } from "../utils/cryptoUtils";
import { Search, Upload, CheckCircle, XCircle, AlertCircle, FileText, Download, ShieldAlert, Check } from "lucide-react";
import CertificateModal from "./CertificateModal";

export default function VerifyDocument() {
  const { getReadOnlyContract, getSignerContract, account, isConnected, connectWallet } = useWallet();

  const [inputHash, setInputHash] = useState("");
  const [file, setFile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Revogação
  const [revocationReason, setRevocationReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  // Modal Certidão
  const [showCertificate, setShowCertificate] = useState(false);

  // Manipulador de drag and drop
  const handleFileDrop = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMsg(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const hash = await calculateFileSHA256(selectedFile);
      setInputHash(hash);
      await performVerification(hash);
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setErrorMsg("Erro ao calcular hash do arquivo.");
    } finally {
      setIsSearching(false);
    }
  };

  // Consulta no Smart Contract
  const performVerification = async (hashToVerify) => {
    const targetHash = (hashToVerify || inputHash).trim();
    if (!targetHash) {
      setErrorMsg("Insira o hash criptográfico ou selecione um arquivo.");
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setSearchResult(null);
    setHasSearched(true);
    setRevokeSuccess(false);

    try {
      const formattedHash = targetHash.startsWith("0x") ? targetHash : "0x" + targetHash;
      const contract = await getReadOnlyContract();
      const doc = await contract.verifyDocument(formattedHash);

      if (doc.exists) {
        setSearchResult({
          hash: formattedHash,
          exists: true,
          isValid: doc.isValid,
          title: doc.title,
          documentType: doc.documentType,
          description: doc.description,
          owner: doc.owner,
          registeredAt: Number(doc.registeredAt),
          registeredDate: formatTimestamp(doc.registeredAt),
          revocationReason: doc.revocationReason,
          revokedAt: Number(doc.revokedAt),
          revokedDate: doc.revokedAt > 0 ? formatTimestamp(doc.revokedAt) : null,
        });
      } else {
        setSearchResult({ exists: false, hash: formattedHash });
      }
    } catch (err) {
      console.error("Erro na verificação:", err);
      setErrorMsg(err.reason || err.message || "Erro ao consultar contrato inteligente.");
    } finally {
      setIsSearching(false);
    }
  };

  // Processo de Revogação
  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!revocationReason.trim()) {
      setErrorMsg("Informe a justificativa da revogação.");
      return;
    }

    setIsRevoking(true);
    setErrorMsg(null);

    try {
      const contract = await getSignerContract();
      const tx = await contract.revokeDocument(searchResult.hash, revocationReason.trim());
      await tx.wait();

      setRevokeSuccess(true);
      await performVerification(searchResult.hash);
      setRevocationReason("");
    } catch (err) {
      console.error("Erro na revogação:", err);
      let msg = err.reason || err.message;
      if (err.data && err.data.message) msg = err.data.message;
      if (msg.includes("Nao autorizado")) {
        msg = "Acesso Negado: Apenas a carteira titular que registrou o documento tem permissão para revogá-lo.";
      }
      setErrorMsg(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  const isOwner =
    isConnected &&
    searchResult &&
    account &&
    searchResult.owner.toLowerCase() === account.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in space-y-10">
      {/* Cabeçalho Editorial */}
      <div className="space-y-2 border-b border-[#EAEAEA] pb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#787774]">
          <span>Módulo de Auditoria</span>
          <span>/</span>
          <span>Validação Pública</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#111111]">
          Verificação de Autenticidade
        </h1>
        <p className="text-xs sm:text-sm text-[#787774] max-w-2xl leading-relaxed">
          Consulte gratuitamente se um documento digital é autêntico, quem é o titular legal do registro e o carimbo de data/hora original gravado na rede.
        </p>
      </div>

      {/* Caixa de Busca com Duplo Caminho */}
      <div className="bento-card space-y-6">
        {/* Opção 1: Upload para Comparação */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#787774]">
            Opção 1: Arraste o arquivo original para verificação instantânea
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileDrop(e.dataTransfer.files[0]);
              }
            }}
            className="border border-dashed border-[#D0D0CE] hover:border-[#111111] rounded-lg p-5 text-center bg-[#FAFAFA] hover:bg-[#F5F5F4] transition-all cursor-pointer relative"
          >
            <input
              type="file"
              onChange={(e) => e.target.files && handleFileDrop(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center gap-2.5">
              <Upload className="w-4 h-4 text-[#111111]" strokeWidth={1.75} />
              <span className="text-xs font-medium text-[#111111]">
                {file ? `Arquivo analisado: ${file.name}` : "Selecione ou solte o arquivo para conferência automática"}
              </span>
            </div>
          </div>
        </div>

        {/* Divisor Minimalista */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#EAEAEA]"></div>
          <span className="absolute bg-white px-3 text-[10px] font-mono uppercase tracking-widest text-[#787774]">
            ou insira o hash diretamente
          </span>
        </div>

        {/* Opção 2: Campo de Entrada do Hash */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performVerification();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="0x8a92... (Cole a assinatura digital SHA-256)"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="editorial-input font-mono text-xs pr-8"
            />
            <Search className="w-3.5 h-3.5 text-[#787774] absolute right-3 top-3" strokeWidth={1.75} />
          </div>
          <button
            type="submit"
            disabled={isSearching || !inputHash.trim()}
            className="btn-primary py-2.5 px-5 text-xs font-medium"
          >
            {isSearching ? "Consultando..." : "Verificar Autenticidade"}
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-md bg-[#FDEBEC] border border-[#FAD1D3] text-xs text-[#9F2F2D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Resultados da Verificação */}
      {hasSearched && searchResult && (
        <div className="space-y-6">
          {searchResult.exists ? (
            <div className="bento-card space-y-6">
              {/* Faux-OS / Notary Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]"></span>
                  </div>
                  <span className="text-[11px] font-mono text-[#787774] ml-2">
                    Registro #{searchResult.hash.slice(0, 10)}...
                  </span>
                </div>

                <div>
                  {searchResult.isValid ? (
                    <span className="badge-valid">
                      <CheckCircle className="w-3 h-3" strokeWidth={2} />
                      Documento Válido & Vigente
                    </span>
                  ) : (
                    <span className="badge-revoked">
                      <ShieldAlert className="w-3 h-3" strokeWidth={2} />
                      Documento Revogado
                    </span>
                  )}
                </div>
              </div>

              {/* Título & Botão de Certidão */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#787774]">
                    {searchResult.documentType}
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-[#111111] mt-0.5">
                    {searchResult.title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="btn-secondary self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
                  Baixar Certidão PDF
                </button>
              </div>

              {/* Grid de Metadados Oficiais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bento-card-subtle space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#787774]">Data e Hora do Registro</span>
                  <p className="font-medium text-[#111111]">{searchResult.registeredDate}</p>
                </div>

                <div className="bento-card-subtle space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#787774]">Status Jurídico On-Chain</span>
                  <p className="font-medium text-[#111111]">
                    {searchResult.isValid ? "Em vigor na rede Ethereum" : "Revogado pelo titular"}
                  </p>
                </div>

                <div className="bento-card-subtle space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-mono uppercase text-[#787774]">Titular do Registro (Owner)</span>
                  <p className="font-mono text-[11px] text-[#2F3437] break-all">{searchResult.owner}</p>
                </div>

                <div className="bento-card-subtle space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-mono uppercase text-[#787774]">Hash SHA-256 Autenticado</span>
                  <p className="font-mono text-[11px] text-[#2F3437] break-all">{searchResult.hash}</p>
                </div>

                {searchResult.description && (
                  <div className="bento-card-subtle space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-mono uppercase text-[#787774]">Observações Adicionais</span>
                    <p className="text-[#2F3437]">{searchResult.description}</p>
                  </div>
                )}

                {!searchResult.isValid && (
                  <div className="p-3.5 rounded-md bg-[#FDEBEC] border border-[#FAD1D3] space-y-1 sm:col-span-2 text-xs text-[#9F2F2D]">
                    <span className="font-semibold block">Justificativa da Revogação:</span>
                    <p>{searchResult.revocationReason}</p>
                    <p className="text-[10px] text-[#9F2F2D]/80 font-mono mt-1">Data da revogação: {searchResult.revokedDate}</p>
                  </div>
                )}
              </div>

              {/* Módulo de Revogação Notarial */}
              {searchResult.isValid && (
                <div className="pt-6 border-t border-[#EAEAEA] space-y-3">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#787774]">
                      Ação Restrita: Revogação Notarial
                    </h4>
                    <p className="text-xs text-[#787774]">
                      {isOwner
                        ? "Você é o titular deste registro e pode revogá-lo publicamente na blockchain."
                        : "Apenas a carteira titular possui autorização no Smart Contract para revogar este documento."}
                    </p>
                  </div>

                  <form onSubmit={handleRevoke} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Descreva a justificativa jurídica para revogar (ex: cancelamento de mandato)..."
                      value={revocationReason}
                      onChange={(e) => setRevocationReason(e.target.value)}
                      className="editorial-input text-xs"
                      required
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isRevoking}
                        className="btn-danger text-xs"
                      >
                        {isRevoking ? "Revogando no Smart Contract..." : "Revogar Registro na Blockchain"}
                      </button>
                      {!isOwner && isConnected && (
                        <span className="text-[11px] text-[#787774]">
                          (Regra do Smart Contract: transação será rejeitada se você não for o titular)
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bento-card p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#787774]">
                <XCircle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#111111]">Documento Não Encontrado</h3>
              <p className="text-xs text-[#787774] max-w-sm mx-auto">
                Nenhum registro com esta assinatura digital foi localizado no contrato inteligente. O arquivo pode ter sido modificado ou ainda não foi registrado.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Certidão Oficial */}
      {showCertificate && searchResult && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          docData={searchResult}
        />
      )}
    </div>
  );
}
