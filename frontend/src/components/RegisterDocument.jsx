import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { calculateFileSHA256 } from "../utils/cryptoUtils";
import { Upload, FileText, CheckCircle, AlertCircle, Shield, Copy, Check, FileCheck, ArrowUpRight } from "lucide-react";
import CertificateModal from "./CertificateModal";

export default function RegisterDocument() {
  const { isConnected, connectWallet, getSignerContract, account, refreshBalance } = useWallet();

  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);

  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("Contrato");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txReceipt, setTxReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Modal de Certidão Oficial
  const [showCertificate, setShowCertificate] = useState(false);

  // Manipulador de upload de arquivo
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMsg(null);
    setTxReceipt(null);
    setIsHashing(true);

    try {
      const hash = await calculateFileSHA256(selectedFile);
      setFileHash(hash);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      console.error("Erro ao calcular hash:", err);
      setErrorMsg("Falha ao calcular hash do arquivo.");
    } finally {
      setIsHashing(false);
    }
  };

  // Envio da transação para o Smart Contract no Ganache
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!fileHash) {
      setErrorMsg("Selecione um arquivo digital para gerar o hash.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("O título do documento é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setTxReceipt(null);

    try {
      const contract = await getSignerContract();
      const tx = await contract.registerDocument(
        fileHash,
        title.trim(),
        documentType,
        description.trim()
      );

      const receipt = await tx.wait();

      setTxReceipt({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "N/A",
      });

      await refreshBalance(account);
    } catch (err) {
      console.error("Erro no registro notarial:", err);
      let msg = err.reason || err.message;
      if (err.data && err.data.message) msg = err.data.message;
      if (msg.includes("Documento ja registrado")) {
        msg = "Este documento já foi registrado anteriormente nesta Blockchain (duplicidade rejeitada pelo Smart Contract).";
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in space-y-10">
      {/* Cabeçalho Editorial */}
      <div className="space-y-2 border-b border-[#EAEAEA] pb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#787774]">
          <span>Módulo Notarial</span>
          <span>/</span>
          <span>Livro de Registros</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#111111]">
          Registro Público de Documentos
        </h1>
        <p className="text-xs sm:text-sm text-[#787774] max-w-2xl leading-relaxed">
          Gere um carimbo temporal imutável e prova criptográfica de integridade on-chain. O arquivo original nunca é enviado; somente a impressão digital SHA-256 é registrada.
        </p>
      </div>

      {/* Grid Bento Assimétrico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário Principal (8 colunas) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleRegister} className="bento-card space-y-6">
            {/* Seção 1: Seleção de Arquivo / Dropzone Utilitário */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#787774]">
                1. Arquivo Original
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="relative border border-dashed border-[#D0D0CE] hover:border-[#111111] rounded-lg p-6 sm:p-8 text-center bg-[#FAFAFA] hover:bg-[#F5F5F4] transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 rounded-md bg-white border border-[#EAEAEA] flex items-center justify-center text-[#111111] group-hover:scale-95 transition-transform">
                    <Upload className="w-5 h-5 text-[#111111]" strokeWidth={1.75} />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#111111]">
                    {file ? file.name : "Clique para selecionar ou arraste o arquivo aqui"}
                  </p>
                  <p className="text-[11px] text-[#787774]">
                    PDF, DOCX, Imagens ou contratos digitais (cálculo de hash local seguro)
                  </p>
                </div>
              </div>
            </div>

            {/* Inspetor de Hash Criptográfico */}
            {isHashing && (
              <div className="badge-info py-2 px-3 rounded-md w-full justify-start font-mono text-xs">
                <span>Calculando hash SHA-256 via Web Crypto API...</span>
              </div>
            )}

            {fileHash && !isHashing && (
              <div className="bento-card-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[#111111] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#111111]" strokeWidth={1.75} />
                    Hash Criptográfico SHA-256 (On-Chain)
                  </span>
                  <button
                    type="button"
                    onClick={copyHashToClipboard}
                    className="keystroke cursor-pointer hover:bg-[#EAEAEA] transition-colors"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-[#346538] mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedHash ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <div className="font-mono text-xs text-[#2F3437] break-all bg-white p-2.5 rounded border border-[#EAEAEA]">
                  {fileHash}
                </div>
                <p className="text-[11px] text-[#787774]">
                  Tamanho: {(file.size / 1024).toFixed(1)} KB • Arquivo permanece estritamente local
                </p>
              </div>
            )}

            {/* Seção 2: Metadados do Registro */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#787774]">
                2. Metadados do Documento
              </label>

              <div className="space-y-1">
                <span className="text-xs text-[#2F3437] font-medium">Título do Documento *</span>
                <input
                  type="text"
                  placeholder="Ex: Contrato de Cessão de Direitos Autorais"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="editorial-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#2F3437] font-medium">Classificação Notarial</span>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="editorial-input cursor-pointer"
                >
                  <option value="Contrato">Contrato Comercial / Acordo</option>
                  <option value="Certidão">Certidão / Atestado</option>
                  <option value="Escritura">Escritura / Declaração Pública</option>
                  <option value="Diploma">Diploma / Certificação Acadêmica</option>
                  <option value="Procuração">Procuração</option>
                  <option value="Registro de Log">Registro de Log / Auditoria</option>
                  <option value="Rastreabilidade">Rastreabilidade de Produto</option>
                  <option value="Outro">Outro Documento</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#2F3437] font-medium">Descrição / Observações (Opcional)</span>
                <textarea
                  rows="3"
                  placeholder="Finalidade, partes envolvidas ou cláusulas de referência..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="editorial-input"
                ></textarea>
              </div>
            </div>

            {/* Alerta de Erro / Rejeição de Duplicidade */}
            {errorMsg && (
              <div className="p-3.5 rounded-md bg-[#FDEBEC] border border-[#FAD1D3] text-xs text-[#9F2F2D] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="space-y-0.5">
                  <p className="font-semibold">Rejeição na Operação</p>
                  <p className="text-[#9F2F2D]/90">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Recibo de Confirmação da Transação */}
            {txReceipt && (
              <div className="p-5 rounded-md bg-[#EDF3EC] border border-[#D4E7D2] text-xs space-y-3">
                <div className="flex items-center gap-2 text-[#346538] font-medium">
                  <CheckCircle className="w-4 h-4" strokeWidth={1.75} />
                  <span>Documento Registrado com Sucesso na Blockchain</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-[#2F3437] bg-white/70 p-3 rounded border border-[#D4E7D2]">
                  <p>Bloco Ganache: #{txReceipt.blockNumber}</p>
                  <p className="break-all">Hash Tx: {txReceipt.txHash}</p>
                  <p>Gas Utilizado: {txReceipt.gasUsed}</p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCertificate(true)}
                    className="btn-primary py-2 px-3 text-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
                    Emitir Certidão Notarial em PDF
                  </button>
                </div>
              </div>
            )}

            {/* Botão de Envio Primário */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isHashing || !fileHash}
                className="w-full btn-primary py-3 text-xs uppercase tracking-wider font-medium"
              >
                {isSubmitting ? (
                  "Gravando no Smart Contract (Ganache)..."
                ) : !isConnected ? (
                  "Conectar Carteira para Registrar"
                ) : (
                  "Registrar Documento no Livro Público"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Coluna Lateral Informativa (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card de Privacidade & Arquitetura */}
          <div className="bento-card space-y-3">
            <h3 className="font-serif text-base font-semibold text-[#111111] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#111111]" strokeWidth={1.75} />
              Garantia de Privacidade
            </h3>
            <p className="text-xs text-[#787774] leading-relaxed">
              Em conformidade com as diretrizes de proteção de dados, o arquivo permanece estritamente sob posse do usuário. Apenas a sua assinatura digital unidirecional (hash) é enviada à máquina virtual Ethereum.
            </p>
            <div className="bento-card-subtle space-y-2 text-xs">
              <span className="font-medium text-[#111111] block">Gravado On-Chain:</span>
              <ul className="space-y-1.5 text-[11px] text-[#787774]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                  Hash SHA-256 único (256 bits)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                  Carimbo de data/hora (block.timestamp)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                  Endereço público do titular (msg.sender)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                  Status de vigência (isValid)
                </li>
              </ul>
            </div>
          </div>

          {/* Card de Regra de Negócio (Duplicidade) */}
          <div className="bento-card space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#787774]">
              Regra de Unicidade Notarial
            </h4>
            <p className="text-xs text-[#787774] leading-relaxed">
              O contrato inteligente impede a existência de dois registros com a mesma impressão digital. Ao tentar registrar novamente o mesmo arquivo, o contrato reverte a transação por duplicidade.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Certidão Notarial */}
      {showCertificate && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          docData={{
            hash: fileHash,
            title: title,
            documentType: documentType,
            owner: account,
            isValid: true,
            registeredDate: new Date().toLocaleString("pt-BR"),
          }}
        />
      )}
    </div>
  );
}
