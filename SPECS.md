# Especificação de Requisitos do Projeto: Cartório Distribuído (DApp)

## 1. Visão Geral do Projeto
O **Cartório Distribuído** é uma Aplicação Descentralizada (DApp) projetada para modernizar e descentralizar serviços notariais — como autenticação de documentos, reconhecimento de autoria, registro público de declarações/contratos e verificação de integridade temporal (*timestamping*) —, eliminando intermediários centralizados e reduzindo custos e burocracia através da tecnologia Blockchain.

---

## 2. Definição do Problema e Justificativa da Blockchain

### 2.1 O Problema
- **Cartórios tradicionais e sistemas legados:** Altos custos cartorários, dependência de presença física ou plataformas web centralizadas vulneráveis a invasões, adulterações de bancos de dados relacionais e pontos únicos de falha (*single point of failure*).
- **Falta de transparência e auditoria:** Dificuldade de auditoria pública e independente sobre a data e integridade exata em que um documento foi emitido ou alterado.
- **Risco de fraude:** Modificação retroativa de registros documentais, falsificação de certidões e litígios sobre anterioridade de documentos.

### 2.2 Por que utilizar Blockchain?
- **Imutabilidade:** Registros gravados no Smart Contract não podem ser apagados ou alterados retroativamente por nenhuma autoridade ou invasor.
- **Transparência e Auditabilidade:** Qualquer cidadão ou entidade pode verificar a autenticidade e validade de um documento sem precisar pagar taxas a intermediários.
- **Descentralização e Disponibilidade:** Ausência de ponto único de falha; histórico distribuído e mantido por nós da rede.
- **Timestamp Criptográfico (Prova de Existência):** O hash do documento e o carimbo temporal do bloco provam categoricamente que o documento existia naquele exato estado na data/hora da transação.

---

## 3. Stack Tecnológica Definida (Ecossistema Ethereum Local)

Para atender aos requisitos técnicos e de desenvolvimento, a seguinte stack foi estabelecida:

| Camada | Tecnologia | Justificativa / Papel no Projeto |
| :--- | :--- | :--- |
| **Blockchain Local (Ethereum)** | **Ganache** (GUI ou CLI) | Nó Ethereum local rápido e visual, executando em `http://127.0.0.1:7545` (GUI) ou `http://127.0.0.1:8545` (CLI), Chain ID `1337` / `5777`. Fornece 10 contas pré-financiadas com 100 ETH cada, histórico de blocos e transações em tempo real. |
| **Linguagem de Smart Contract** | **Solidity (v0.8.20+)** | Linguagem oficial de contratos para a Ethereum Virtual Machine (EVM), com verificação de erros customizados, tipagem estática e eventos indexados. |
| **Ambiente de Compilação & Testes** | **Hardhat** (conectado à rede local Ganache) | Gerenciador do ciclo de vida dos contratos: compilação (`solc`), execução de suíte de testes automatizados (`npx hardhat test`) e scripts de implantação/deploy no Ganache. |
| **Backend / API Notarial** | **Node.js + Express** | Servidor de aplicação que realiza a orquestração off-chain: API REST para upload de documentos e armazenamento seguro de anexos/metadados, escuta ativa de eventos do contrato (*Event Listener* via Ethers.js), geração de certidões/comprovantes de autenticidade em PDF e relatórios de auditoria. |
| **Frontend do DApp** | **React + Vite + Tailwind CSS (v3.4)** | Interface de usuário componentizada, fluida e com design notarial premium com **Glassmorphism** (cards translúcidos com blur de fundo, bordas sutis iluminadas, gradientes escuros refinados e tipografia Inter). Conecta à carteira MetaMask, calcula hashes no navegador e exibe o explorador de blocos em tempo real. |
| **Integração Web3** | **Ethers.js (v6)** | Utilizado tanto no backend Node.js (para escuta de eventos e interações de servidor) quanto no frontend React (para assinar transações via MetaMask e consultas públicas via JsonRpcProvider). |
| **Carteira / Provedor** | **MetaMask** | Extensão de navegador conectada à rede RPC do Ganache para assinatura criptográfica e autorização de registros pelos usuários. |
| **Criptografia no Cliente** | **Web Crypto API (`crypto.subtle`) / Ethers.js Keccak256** | Cálculo instantâneo do hash SHA-256/Keccak no navegador do usuário antes do envio, preservando a integridade e privacidade do arquivo original. |

---

## 4. Arquitetura e Modelo de Dados (On-Chain vs Off-Chain)

Para garantir escalabilidade, privacidade e viabilidade técnica, os dados são divididos em:

### 4.1 Dados On-Chain (Gravados na Blockchain)
- **Hash do Documento (SHA-256 / Keccak-256):** Identificador criptográfico único do conteúdo do arquivo original.
- **Endereço do Proprietário/Registrante (`address`):** Chave pública da carteira que originou o registro.
- **Timestamp do Bloco (`block.timestamp`):** Carimbo de data/hora oficial da inclusão no bloco.
- **Identificador Único (`uint256 id` ou `bytes32 hash`):** Chave primária do registro.
- **Metadados essenciais:** Título do documento, tipo do documento (ex: Certidão, Procuração, Contrato), status de revogação/validade (`bool isActive`).
- **Histórico de Transações/Eventos:** Eventos emitidos (`DocumentRegistered`, `DocumentRevoked`, `OwnershipTransferred`).

### 4.2 Dados Off-Chain (Armazenados fora da Blockchain)
- **Arquivo Físico Original (PDF, imagem, etc.):** Permanece com o usuário (ou em armazenamento distribuído como IPFS / local).
- **Dados Sensíveis e PII (LGPD):** Nenhum dado pessoal não criptografado é gravado diretamente na blockchain.

---

## 5. Requisitos do Smart Contract (Regras de Negócio)

O Smart Contract deve implementar as seguintes regras essenciais:

1. **Registro Único de Documento (`registerDocument`):**
   - Não permitir o registro duplicado do mesmo hash (evitar duplicidade de registros).
   - Validar que o hash fornecido não seja vazio.
   - Armazenar o endereço do remetente (`msg.sender`) e o timestamp.
   - Emitir evento de confirmação.

2. **Consulta e Verificação (`verifyDocument` / `getDocument`):**
   - Consulta pública e gratuita (funções `view`) informando se o documento existe, quem é o titular, data de emissão e seu status.

3. **Controle de Acesso e Permissões:**
   - Apenas o proprietário original (ou administrador definido) pode revogar (`revokeDocument`) ou transferir a titularidade de um registro.
   - Rejeição com reversão de transação (`require` / `revert`) em caso de chamada não autorizada.

4. **Revogação ou Atualização de Status:**
   - Mecanismo para invalidar um documento previamente emitido (ex: certidão cancelada ou procuração revogada), mantendo o histórico auditável.

---

## 6. Interface da Aplicação (DApp Frontend)

A interface deve ser intuitiva e contemplar:

1. **Painel de Registro:**
   - Upload de arquivo com cálculo automático do hash criptográfico (SHA-256/Keccak) no próprio navegador.
   - Formulário de metadados (Título, Categoria, Descrição breve).
   - Botão para envio da transação assinado via carteira (ex: MetaMask) conectada à rede local.
   - Feedback visual de progresso, hash da transação e confirmação de inclusão em bloco.

2. **Área de Consulta e Validação:**
   - Campo para upload de arquivo ou digitação manual de hash para conferência instantânea.
   - Exibição do resultado: Selo de Autenticidade (Válido / Revogado / Inexistente), data de registro, bloco e endereço do emissor.

3. **Visualizador da Blockchain (Blockchain Explorer Local):**
   - Lista dos últimos blocos minerados.
   - Lista das últimas transações e eventos emitidos.
   - Visualização dos dados do bloco (número, hash, timestamp, gas utilizado).

4. **Diretrizes Visuais (Design System Glassmorphism & Tailwind CSS):**
   - **Estética Notarial Futurista:** Fundo escuro refinado (`slate-950`/`zinc-900`) com gradientes em profundidade e iluminação sutil (*glowing orbs*).
   - **Efeito Vidro Translúcido (*Glassmorphism*):** Cards e modais com `bg-white/5` a `bg-white/10`, `backdrop-blur-xl` e bordas ultrafinas brilhantes (`border border-white/10`).
   - **Hierarquia e Tipografia:** Fonte moderna sans-serif (Inter), pesos contrastantes e badges com micro-brilho.
   - **Indicadores de Estado Notariais:** Esmeralda / Ciano para "Autêntico & Válido", Âmbar para "Em Processamento", e Carmim / Rose para "Revogado / Inválido".
   - **Micro-animações:** Transições suaves em hovers, loaders animados de mineração e feedback táctil nas assinaturas de transação.

---

## 7. Plano de Testes Automatizados e Manuais

### 7.1 Testes de Casos Válidos (Caminho Feliz)
- Registro com sucesso de novo documento com hash e metadados válidos.
- Consulta de documento existente retornando valores idênticos aos gravados.
- Revogação de documento realizada com sucesso pelo titular legítimo.
- Verificação de emissão correta dos eventos no log do contrato.

### 7.2 Testes de Casos Inválidos e Rejeições (Regras de Negócio & Segurança)
- **Tentativa de duplicidade:** Rejeição ao tentar registrar um hash já existente.
- **Hash inválido/vazio:** Rejeição ao tentar registrar strings nulas ou hashes corrompidos.
- **Tentativa de revogação não autorizada:** Rejeição (`Unauthorized`) quando um endereço diferente do titular tenta revogar o documento.
- **Consulta de documento inexistente:** Retorno coerente de não encontrado sem travamento da aplicação.

---

## 8. Entregáveis do Projeto

| Item | Descrição |
| :--- | :--- |
| **Repositório GitHub** | Código-fonte completo: Contrato inteligente em Solidity, backend em Node.js/Express, frontend em React, testes automatizados e arquivos de configuração de dependências. |
| **Guia de Instalação e Execução (README)** | Passo a passo reprodutível para iniciar a blockchain local no Ganache, compilar/fazer deploy do contrato, iniciar a API Node.js e subir o frontend React. |
| **Relatório Técnico** | Documentação detalhando: problema, objetivos, justificativa da blockchain, arquitetura, implementação, suite de testes, limitações identificadas e conclusão. |
| **Roteiro de Testes** | Tabela contendo operações executadas, entradas fornecidas, resultados esperados e resultados obtidos. |
| **Material de Apresentação** | Slides de apresentação e **vídeo de demonstração gravado** (backup em caso de falha técnica ao vivo). |

---

## 9. Roteiro de Apresentação (Total: 10 Minutos)

| Tempo | Etapa | Conteúdo Obrigatório |
| :---: | :--- | :--- |
| **00:00 - 02:00** (2 min) | **Problema & Justificativa** | Apresentar o problema dos cartórios tradicionais, objetivos do projeto e justificativa técnica da Blockchain. |
| **02:00 - 04:00** (2 min) | **Arquitetura & Smart Contract** | Apresentar a arquitetura técnica (React + Node.js + Solidity + Ganache), divisão on-chain vs off-chain, estrutura do Smart Contract e regras de negócio. |
| **04:00 - 08:00** (4 min) | **Demonstração Prática (Ao Vivo)** | 1. Mostrar o Ganache (blockchain local) em execução com contas e blocos.<br>2. Realizar registro de documento pela interface React e mostrar confirmação da transação minerada no Ganache.<br>3. Consultar o registro e evidenciar alteração de estado no contrato (e no backend).<br>4. Demonstrar rejeição de operação inválida/não autorizada (ex: revogação por terceiro ou hash duplicado). |
| **08:00 - 10:00** (2 min) | **Testes, Limitações e Conclusão** | Exibir execução da suíte de testes automatizados, discutir limitações identificadas e considerações finais. |

---

## 10. Critérios de Avaliação
- Pertinência do uso de Blockchain para o problema escolhido.
- Funcionamento e estabilidade da aplicação integrada à blockchain local.
- Qualidade e cobertura dos testes (válidos e inválidos).
- Qualidade e completude da documentação técnica no repositório.
- Clareza da apresentação e domínio demonstrado por todos os integrantes da equipe.
