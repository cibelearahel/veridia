/**
 * Utilitários de criptografia e formatação para o Veridia (Cartório Distribuído)
 */

/**
 * Calcula o hash SHA-256 de um arquivo diretamente no navegador (Web Crypto API)
 * @param {File} file Arquivo selecionado pelo usuário
 * @returns {Promise<string>} Hash formatado em hexadecimal com prefixo '0x'
 */
export async function calculateFileSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hexString;
}

/**
 * Encurta um endereço Ethereum para exibição amigável (ex: 0x1234...abcd)
 */
export function truncateAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Encurta um Hash de 64 caracteres hexadecimais
 */
export function truncateHash(hash) {
  if (!hash) return "";
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Formata um timestamp Unix em data legível no padrão brasileiro
 */
export function formatTimestamp(timestamp) {
  if (!timestamp || Number(timestamp) === 0) return "N/A";
  const num = typeof timestamp === "string" ? parseInt(timestamp, 10) : Number(timestamp);
  return new Date(num * 1000).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
