# 🏛️ Cartório Distribuído (DApp Notarial em Ethereum Local)

> Aplicação Descentralizada (DApp) para fé pública digital, carimbo de data/hora (*timestamping* criptográfico) e verificação de autenticidade de documentos em Blockchain Ethereum (Ganache).

---

## 1. Problema & Justificativa da Blockchain

### O Problema
Cartórios tradicionais e plataformas legadas de gestão documental enfrentam:
- Altos custos notariais por autenticação.
- Dependência de intermediários físicos ou servidores centralizados sujeitos a vazamentos, adulteração de dados e pontos únicos de falha (*single point of failure*).
- Dificuldade para cidadãos e terceiros realizarem auditoria pública, instantânea e gratuita da integridade temporal (*timestamping*) e autoria de certidões, contratos e procurações.

### A Solução com Blockchain
- **Imutabilidade Criptográfica:** Uma vez gravado no Smart Contract, o registro é perpétuo e matematicamente impossível de ser forjado ou alterado retroativamente.
- **Transparência & Gratuidade de Consulta:** Qualquer pessoa no mundo pode consultar e validar a autenticidade de um documento sem pagar taxas (chamadas `view`).
- **Privacidade & Conformidade LGPD (Modelo On-Chain vs Off-Chain):**
  - **On-Chain:** Apenas o hash criptográfico (SHA-256 de 256 bits), metadados públicos essenciais (título, categoria, carimbo temporal, titularidade) e status de validade.
  - **Off-Chain:** O arquivo físico original permanece sob a posse segura do titular, garantindo privacidade e total sigilo.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Blockchain Local** | **Ganache** (GUI em `http://127.0.0.1:7545` ou CLI em `8545`, Chain ID 1337/5777) |
| **Smart Contract** | **Solidity (v0.8.24)** |
| **Ambiente de Compilação & Testes** | **Hardhat** (Mocha + Chai + Ethers v6) |
| **Backend / API Notarial** | **Node.js + Express** (geração de certidão em PDF com PDFKit, Ethers v6) |
| **Frontend DApp** | **React + Vite + Tailwind CSS v3.4** (estética Glassmorphism) |
| **Carteira Web3** | **MetaMask** |

---

## 3. Estrutura do Repositório

```text
CartorioDistribuido/
├── contracts/
│   └── CartorioNotarial.sol       # Contrato inteligente com regras de negócio e controle de acesso
├── scripts/
│   └── deploy.js                  # Deploy no Ganache e sincronização de ABI/endereço
├── backend/                       # API Express (Upload, cálculo de hash e emissão de Certidão em PDF)
│   ├── src/
│   │   ├── server.js              # Servidor na porta 3001
│   │   ├── services/              # Integração blockchain e PDFKit
│   │   └── routes/                # Endpoints REST
│   └── package.json
├── frontend/                      # DApp React + Vite + Tailwind CSS (Glassmorphism)
│   ├── src/
│   │   ├── components/            # Registro, Consulta/Validação, Explorer e Certidão
│   │   ├── context/               # Conexão MetaMask e Ethers v6
│   │   └── App.jsx
│   └── package.json
├── hardhat.config.js              # Configuração Hardhat para a rede Ganache
├── SPECS.md                       # Especificação completa dos requisitos acadêmicos
└── package.json                   # Scripts de orquestração do projeto
```

---

## 4. Guia de Instalação e Execução Passo a Passo

### Pré-requisitos
- **Node.js** (versão 18+ ou 20+) e **npm**.
- **Ganache** instalado (Ganache GUI ou Ganache CLI).
- Extensão **MetaMask** instalada no navegador.

---

### Passo 1: Instalar Dependências
No diretório raiz do projeto, instale as dependências de cada camada:
```powershell
# Dependências do Hardhat / Raiz
npm install

# Dependências do Backend
npm --prefix backend install

# Dependências do Frontend
npm --prefix frontend install
```

---

### Passo 2: Iniciar a Blockchain Local (Ganache)
Abra o **Ganache GUI** ou execute via terminal:
```powershell
npx ganache --port 7545 --chain.networkId 1337 --chain.chainId 1337
```
> O Ganache criará 10 contas locais pré-financiadas com 100 ETH cada.

---

### Passo 3: Fazer o Deploy do Smart Contract no Ganache
Execute o script de implantação:
```powershell
# Se estiver usando a porta 7545 (padrão Ganache GUI):
npm run deploy:ganache

# Se estiver usando a porta 8545 (Ganache CLI):
npm run deploy:cli
```
> O script implantará o contrato e atualizará automaticamente o arquivo `contractConfig.json` tanto no backend quanto no frontend.

---

### Passo 4: Iniciar o Backend e Frontend

**Terminal 1 (Backend API):**
```powershell
npm run server
```
*A API iniciará em `http://localhost:3001`.*

**Terminal 2 (Frontend React):**
```powershell
npm run client
```
*A aplicação abrirá em `http://localhost:5173`.*

---

### Passo 5: Configurar a MetaMask
1. Abra a extensão MetaMask.
2. Adicione uma rede manual:
   - **Nome da Rede:** Ganache Local
   - **URL do RPC:** `http://127.0.0.1:7545` (ou `http://127.0.0.1:8545`)
   - **ID da Cadeia (Chain ID):** `1337` (ou `5777`, conforme exibido no seu Ganache)
   - **Símbolo da Moeda:** `ETH`
3. Importe uma conta do Ganache copiando a **Chave Privada** (*Private Key*) de qualquer uma das contas listadas no Ganache.

---

