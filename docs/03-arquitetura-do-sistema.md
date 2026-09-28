# 03 — Arquitetura do Sistema

> Seção 3 do relatório técnico do **Veridia — Cartório Distribuído**.
> Descreve como os componentes se organizam, como se comunicam e por que a divisão entre
> eles foi feita dessa forma.

---

## 3.1 Visão geral

| Camada | Tecnologia | Pode acessar o documento original? | Pode escrever na blockchain? |
|--------|-----------|------------------------------------|-----------------------------|
| **Frontend** (React + Vite) | React 18, Ethers v6, MetaMask | **Sim** — é a única, e apenas em memória, para calcular o hash | **Sim** — assina transações via MetaMask |
| **Backend** (Node.js + Express) | Express 4, Ethers v6, PDFKit | **Não** — nunca recebe o arquivo pela interface | **Não** — apenas leitura, por desenho |
| **Contrato** (Solidity) | EVM / Ganache | **Não** — só recebe `bytes32` | É a fonte da verdade |

---

## 3.2 Organização do repositório

| Diretório | Função |
|-----------|--------|
| `contracts/` | Fonte da verdade das regras on-chain. Contém o único contrato do projeto, `CartorioNotarial.sol`, com as funções de registro, consulta e revogação, e os eventos de rastreabilidade. Compilado pelo Hardhat. |
| `scripts/` | Automação do ambiente Hardhat. Contém `deploy.js`, que implanta o contrato e sincroniza o endereço e a ABI com as camadas de backend e frontend. |
| `backend/` | API REST Express (porta 3001). Concentra a integração com a blockchain em modo leitura, a leitura de blocos para o explorador e a geração da certidão em PDF. Também hospeda o `contractConfig.json` gerado pelo deploy. |
| `frontend/` | SPA React (porta 5173). Implementa os três painéis do sistema, a integração com a MetaMask e o cálculo de hash no navegador. Contém uma cópia do `contractConfig.json`. |
| `artifacts/` | Saída gerada pelo compilador do Hardhat: ABI, bytecode de criação e de implantação, e as informações completas de build. Consumida pelo `deploy.js` para extrair a ABI. |
| `cache/` | Cache incremental de compilação do Hardhat. Registra o hash do conteúdo das fontes e os parâmetros do compilador (`solc 0.8.24`, otimizador habilitado, 200 execuções, `evmVersion` `paris`) para evitar recompilações desnecessárias. |
| `docs/` | Documentação técnica, incluindo este relatório. |
| `SPECS.md` | Especificação de requisitos do trabalho acadêmico — o documento de *entrada*, distinto do relatório de *saída*. |
| `README.md` | Guia de instalação e execução. |

---

## 3.3 Tabela de responsabilidades

| Componente | Responsabilidades | Responsabilidades que **não** tem |
|------------|-------------------|-----------------------------------|
| **Contrato** (`CartorioNotarial.sol`) | Validar regras de negócio, persistir o registro, carimbar o tempo, emitir eventos, garantir unicidade e controlar a revogação | Não armazena o documento; não valida que o hash corresponde a um arquivo existente; não conhece identidade civil |
| **Frontend** | Calcular o hash, montar os metadados, solicitar assinatura, exibir resultados, facilitar a auditoria, gerar o PDF sob demanda | Não persiste estado fora do React; não valida regras de negócio (a fonte da verdade é o contrato); não envia o arquivo a servidor algum |
| **Backend** | Agregar leituras, fornecer dados do nó para o explorador, formatar datas em pt-BR, gerar a certidão em PDF | Não assina transação; não valida regras de negócio; não decide nada que o contrato já garanta |
| **MetaMask** | Guardar a chave privada, assinar, gerenciar contas e trocar de rede | Não valida o conteúdo do que assina; não é uma autoridade de registro |
| **Ganache** | Executar a EVM, minerar blocos, responder a JSON-RPC | Não aplica política de negócio; é descartável — todo o estado pode ser reconstruído por `deploy` + registros |

### 3.3.1 O contrato de dados entre as camadas

Backend e frontend mantêm **cópias idênticas** de `contractConfig.json`, geradas pelo
`deploy.js` (`scripts/deploy.js:34-63`):

```json
{
  "contractAddress": "0x...",
  "networkName": "ganache",
  "chainId": "1337",
  "deployedAt": "2026-...Z",
  "deployer": "0x...",
  "abi": [ ... ]
}
```

A duplicação é deliberada. O frontend precisa do endereço **antes** de o backend estar no ar
(por exemplo, para montar um contrato somente-leitura sem depender da API), e o backend
precisa do endereço mesmo com o frontend fora do ar. Um único arquivo-fonte, gerado no
deploy, elimina a chance de as duas cópias divergirem — desde que o deploy seja executado, o
que é o passo obrigatório da instalação. A etapa 2.2 de
[02 — Arquitetura de Dados](02-arquitetura-de-dados.md) descreve por que o arquivo original
**não** é compartilhado entre as camadas.

---

## 3.4 Portas e endereços

| Serviço | Porta | Endereço | Quem consome |
|---------|-------|----------|--------------|
| Ganache (GUI) | 7545 | `http://127.0.0.1:7545` | MetaMask, backend, frontend |
| Ganache (CLI) | 8545 | `http://127.0.0.1:8545` | Alternativa para o backend e o frontend |
| Backend API | 3001 | `http://localhost:3001` | Frontend (via proxy `/api`) |
| Frontend (Vite) | 5173 | `http://localhost:5173` | Navegador do usuário |
| Contrato | — | Endereço em `contractConfig.json` | MetaMask, backend, frontend |

A porta 7545 é a primeira tentativa do backend; a 8545 é o *fallback* automático
implementado em `backend/src/services/blockchainService.js:9-11` e detalhado em
[05 — Backend](05-backend.md).

---

## Navegação

← [02 — Arquitetura de Dados](02-arquitetura-de-dados.md) · Índice: [README](README.md) ·
Próxima: **[04 — Smart Contract](04-smart-contract.md)**
