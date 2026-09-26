import React from "react";
import { Download, X, FileText, CheckCircle, ShieldAlert, Shield } from "lucide-react";
import { formatTimestamp } from "../utils/cryptoUtils";

export default function CertificateModal({ isOpen, onClose, docData }) {
  if (!isOpen || !docData) return null;

  const downloadUrl = `/api/documents/${docData.hash}/certificate`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#FCFCFA] border border-[#EAEAEA] rounded-xl p-6 sm:p-8 text-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-md hover:bg-[#F0F0ED] text-[#787774] hover:text-[#111111] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>

        {/* Cabeçalho Notarial */}
        <div className="flex items-start gap-3.5 mb-6 border-b border-[#EAEAEA] pb-5">
          <div className="w-10 h-10 rounded-md bg-[#111111] text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#111111]">Certidão Notarial Digital</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#787774] border border-[#EAEAEA] px-1.5 py-0.5 rounded bg-white">
                Veridia Oficial
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              Assento lavrado no protocolo Veridia sob livro contábil descentralizado Ethereum
            </p>
          </div>
        </div>

        {/* Selo de Vigência */}
        <div className="mb-5">
          {docData.isValid ? (
            <div className="badge-valid py-1 px-3">
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
              Registro Notarial Válido & Autêntico
            </div>
          ) : (
            <div className="badge-revoked py-1 px-3">
              <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2} />
              Registro Notarial Revogado
            </div>
          )}
        </div>

        {/* Corpo do Documento / Tabela de Metadados */}
        <div className="bg-white border border-[#EAEAEA] rounded-lg p-4 sm:p-5 space-y-3 mb-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <span className="font-mono text-[11px] text-[#787774]">Título:</span>
            <span className="sm:col-span-2 font-medium text-[#111111]">{docData.title}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <span className="font-mono text-[11px] text-[#787774]">Classificação:</span>
            <span className="sm:col-span-2 text-[#2F3437]">{docData.documentType || "Geral"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <span className="font-mono text-[11px] text-[#787774]">Hash SHA-256:</span>
            <span className="sm:col-span-2 font-mono text-[11px] text-[#2F3437] break-all bg-[#F7F6F3] p-1.5 rounded border border-[#EAEAEA]">
              {docData.hash}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <span className="font-mono text-[11px] text-[#787774]">Titular (Owner):</span>
            <span className="sm:col-span-2 font-mono text-[11px] text-[#787774] break-all">
              {docData.owner}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            <span className="font-mono text-[11px] text-[#787774]">Data do Assento:</span>
            <span className="sm:col-span-2 text-[#2F3437]">
              {docData.registeredDate || formatTimestamp(docData.registeredAt)}
            </span>
          </div>

          {!docData.isValid && docData.revocationReason && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-2 border-t border-[#EAEAEA] text-[#9F2F2D]">
              <span className="font-mono text-[11px]">Justificativa:</span>
              <span className="sm:col-span-2 font-medium">{docData.revocationReason}</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-[#EAEAEA]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto btn-secondary"
          >
            Fechar
          </button>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto btn-primary"
          >
            <Download className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
            Baixar Certidão Oficial em PDF
          </a>
        </div>
      </div>
    </div>
  );
}
