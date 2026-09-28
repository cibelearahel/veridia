# 01 — Definição e Escopo

> Seção 1 do relatório técnico do **Veridia — Cartório Distribuído**.
> Esta é a parte conceitual do trabalho: define *o que* o sistema se propõe a resolver,
> *por que* blockchain, *o que* ele se propõe a entregar e, tão importante quanto isso,
> *o que* ele deliberadamente **não** se propõe a fazer.

---

## 1.1 Contextualização

A prática notarial no Brasil nasce da necessidade de dar **fé pública** a documentos e aos
atos jurídicos que esses documentos formalizam. Um cartório não registra apenas o
*conteúdo* de um documento: ele registra **o fato** de que
este documento existiu, com aquele texto, naquela data, e vincula esse registro a um
titular identificado.

Esse modelo funciona, mas depende de um sistema centralizado, sob custódia de uma instituição
específica, que detém o controle do armazenamento destes dados. Desta forma, aparecem certos problemas, como:

- o terceiro que não é parte do documento **não tem como auditar** a data e a integridade do
  registro de forma independente;
- alterar um registro retroativo é, tecnicamente, um simples `UPDATE` — nada na arquitetura
  impede isso, apenas regras e punições;
- a verificação depende da disponibilidade e da boa-fé de um serviço centralizado, o que cria
  um ponto único de falha.

O **Veridia** se propõe a resolver o problema da **âncora temporal e da integridade do
registro**, que carecem de *confiança entre partes desconhecidas*, e portanto exigem uma estrutura de
dados que nenhum participante pode reescrever sozinho.

---

## 1.2 Definição do problema

Formaliza-se o problema em cinco eixos, derivados da análise de requisitos:

| # | Eixo | Descrição |
|---|------|-----------|
| P1 | **Custo e barreira de acesso** | A autenticação notarial tradicional exige deslocamento físico ou plataforma proprietária cobrada por ato. |
| P2 | **Ponto único de falha** | O registro depende de um único servidor centralizado; a indisponibilidade do serviço suspende a verificação. |
| P3 | **Adulterabilidade** | O banco de dados é relacional e mutável; a imutabilidade é uma convenção, não uma propriedade do sistema. |
| P4 | **Não auditabilidade externa** | Não existe meio independente, público e gratuito de conferir se um registro foi alterado ou quando foi feito. |
| P5 | **Assimetria de informação** | O titular tem o documento; o verificador tem apenas a alegação do titular. |

---

## 1.3 Justificativa do uso de blockchain

A escolha por blockchain é justificada pela combinação de quatro propriedades, cada uma
atendendo a um eixo do problema. A tabela abaixo é a coluna vertebral da argumentação
técnica: cada propriedade é declarada, explicada **e ancorada no código que a implementa**.

| Propriedade | Como resolve o problema | Onde está implementada no Veridia |
|-------------|------------------------|----------------------------------|
| **Imutabilidade** | Responde a P3 e P4. Uma vez incluído em um bloco, o registro não pode ser reescrito por ninguém — nem pelo autor, nem pelo operador do nó, nem por um atacante com acesso administrativo. | A revogação **não apaga** o registro: `revokeDocument` altera o status e acrescenta justificativa e data, preservando o histórico (`contracts/CartorioNotarial.sol:139-141`). Não existe função de exclusão no contrato. |
| **Verificação pública e gratuita** | Responde a P1 e P5. `verifyDocument` é declarada `view` (`contracts/CartorioNotarial.sol:92`), ou seja, é uma leitura pura: não altera estado, não gera transação e não custa gas. Qualquer pessoa com um provedor RPC pode chamá-la. | `verifyDocument` retorna uma tupla de 9 campos (`:92-123`); a interface expõe a consulta por hash colado ou por upload de arquivo. |
| **Marca temporal** | Responde a P4. O `block.timestamp` do bloco que incluiu a transação é fixado pelo protocolo e não pode ser escolhido pelo usuário. | `registeredAt: block.timestamp` gravado no registro (`:70`) e repetido no evento `DocumentRegistered` (`:82`). |
| **Identidade criptográfica do titular** | Responde a P5 parcialmente. O titular é um endereço, derivado de uma chave privada: a assinatura prova controle daquela chave, e não apenas que uma string foi digitada. | `owner: msg.sender` (`:69`), com verificação de igualdade em `revokeDocument` (`:135`). |
---

## 1.4 Objetivos

**Objetivo geral.** Desenvolver uma aplicação descentralizada (DApp) que ofereça registro
público, verificação aberta e revogação auditável de documentos digitais, usando uma âncora
temporal em blockchain local, sem exigir a intermediação de uma autoridade cartorial e sem
transmitir o conteúdo dos documentos para a rede.

**Objetivos específicos.** Cada objetivo é rastreável a uma entrega verificável no
repositório:

| # | Objetivo | Entrega correspondente | Verificação |
|---|----------|------------------------|-------------|
| O1 | Permitir o registro de um documento a partir de seu hash criptográfico, vinculando-o ao titular e ao instante do registro. | `registerDocument` (`contracts/CartorioNotarial.sol:54-85`) + aba **Registrar** | Registro concluído, com recibo da transação exibindo bloco e gas. |
| O2 | Assegurar a **unicidade** do registro, impedindo que o mesmo conteúdo seja inscrito duas vezes na base. | `require(documents[_documentHash].registeredAt == 0, ...)` (`:62`) | O segundo registro do mesmo hash é revertido com mensagem explícita. |
| O3 | Permitir a verificação pública, gratuita e instantânea do status de um documento a partir de seu hash ou do próprio arquivo. | `verifyDocument` (`:92-123`) + aba **Verificar** | Um terceiro sem carteira obtém o mesmo resultado. |
| O4 | Permitir a revogação do documento **exclusivamente** pelo titular, com justificativa obrigatória e histórico preservado. | `revokeDocument` (`:131-144`) | O titular revoga com sucesso; um terceiro é rejeitado. |
| O5 | Garantir que o conteúdo do documento **nunca** seja transmitido para a blockchain ou para o servidor, computando o hash no próprio navegador. | `calculateFileSHA256` via Web Crypto API (`frontend/src/utils/cryptoUtils.js:10-16`) | Nenhuma requisição contendo o arquivo é observável no DevTools. |
| O6 | Oferecer ao titular um meio de prova: emissão de certidão em PDF a partir do registro on-chain. | `backend/src/services/certificateService.js` + `GET /api/documents/:hash/certificate` | PDF baixado com carimbo temporal e hash conferível. |
| O7 | Permitir a auditoria pública e independente do histórico de registros e de blocos. | Aba **Explorador** + `GET /api/documents` e `GET /api/documents/blockchain/blocks` | Lista de documentos e de blocos recentes visível sem autenticação. |

---

## 1.5 Escopo

O escopo é a parte da proposta que mais determina a coerência do trabalho: o que
o sistema **inclui** e o que ele **recusa**, e por quê.

### 1.5.1 Incluído no escopo

| Área | O que está incluído | Onde |
|------|--------------------|------|
| Registro | Inscrição de hash, título, categoria e descrição, com validação de hash vazio, título obrigatório e unicidade | `CartorioNotarial.sol:54-85` |
| Verificação | Consulta pública de 9 campos, com retorno coerente para documento inexistente | `CartorioNotarial.sol:92-123` |
| Revogação | Cancelamento pelo titular, com justificativa obrigatória, carimbo temporal próprio e evento | `CartorioNotarial.sol:131-144` |
| Auditoria | Enumeração de todos os documentos e leitura dos blocos recentes | `getAllDocumentHashes` (`:163`) · `getDocumentCount` (`:156`) · explorador local |
| Rastreabilidade | Emissão de eventos de registro e de revogação | `CartorioNotarial.sol:31-44` |
| Comprovação | Certidão notarial em PDF, gerada a partir do registro on-chain | `backend/src/services/certificateService.js` |
| Privacidade | Separação on-chain/off-chain: apenas hash e metadados essenciais na rede | Ver [02 — Arquitetura de Dados](02-arquitetura-de-dados.md) |
| Interface | Três painéis — registrar, verificar e explorar — com conexão de carteira | `frontend/src/App.jsx` |

### 1.5.2 Fora do escopo

Cada item abaixo foi deliberadamente excluído. A coluna **justificativa** é a resposta
esperada a "por que não foi feito?".

| Fora do escopo | Justificativa |
|----------------|---------------|
| **Armazenamento do arquivo em rede** (IPFS, Arweave, S3) | Deliberadamente excluído: implicaria custo de armazenamento contínuo, disponibilidade a manter e um novo problema de verificação de *pinagem*. O arquivo permanece com o titular, e o hash é a âncora. É a decisão que sustenta a conformidade com a LGPD — ver [02](02-arquitetura-de-dados.md). |
| **Assinatura digital qualificada (ICP-Brasil)** | Requer carimbo de tempo com confiança certificadora e uma entidade emissora de MSC (material de segurança criptográfica). É um sistema de confiança hierárquica, ortogonal a blockchain. O Veridia assina a **transação**, não o documento. |
| **Transferência de titularidade** entre carteiras | A especificação previa `transferOwnership`, mas o modelo atual vincula o registro à chave que o inscribed. Ver [09 — Limitações e Divergências](09-limitacoes-e-divergencias.md). |
| **Modelo de permissões com papel de administrador** | Em um cartório existem cartório, escrevente e oficial. O Veridia **não reproduz** a estrutura de pessoas jurídicas do cartório: a titularidade é individual e autodeclarada pela chave privada. |
| **Rede de produção** (mainnet ou testnets públicas) | Todo o ambiente é **local** (Ganache, chain ID 1337). Uma implantação pública exigiria custo de gas por registro, além de auditoria de contrato. |
| **Identificação civil do titular** | Nenhum CPF, RG ou nome é coletado ou gravado. A identidade é pseudônima (endereço). Deliberado, por LGPD e por princípio de minimização de dados. |
| **Taxas, emolumentos e faturamento** | O sistema não cobra, não emite nota e não emite recibo fiscal. A verificação é gratuita por definição (`view`). |
| **Escuta ativa de eventos** (*event listener*) | Prevista na especificação, não implementada: o explorador atual consulta por *polling*. Ver [09](09-limitacoes-e-divergencias.md). |
| **Múltiplos contratos ou versionamento** | Existe um único contrato, sem mecanismo de upgrade. Uma migração exigiria novo endereço e uma política explícita de substituição de registros. |
| **Aplicação móvel** | O escopo é exclusivamente web. |
---

## Navegação

← [Índice](README.md) · Próxima: **[02 — Arquitetura de Dados](02-arquitetura-de-dados.md)**
