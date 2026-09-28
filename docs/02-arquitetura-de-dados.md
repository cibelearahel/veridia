# 02 — Arquitetura de Dados

> Seção 2 do relatório técnico do **Veridia — Cartório Distribuído**.
> Esta seção visa esclarescer: **o que é gravado na blockchain e
> o que nunca sai da máquina do usuário**.

---

## 2.1 Princípio da separação

O Veridia adota uma separação estrita entre a **âncora do registro** e o **conteúdo do
documento**:

> **Na blockchain grava-se apenas o que é necessário para provar a existência, a anterioridade
> e a titularidade de um documento. O documento em si jamais é transmitido para a rede.**

Essa decisão se dá pelas razões a seguir:

1. **Viabilidade.** Um único PDF de 2 MB armazenado on-chain teria um custo alto para uma blockchain pública, e este custo cresceria linearmente com o tamanho.
   Um hash de 32 bytes tem custo fixo e desprezível.
2. **Conformidade legal.** A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) estabelece
   os princípios da **finalidade** e da **minimização** de dados. Gravar conteúdo de documentos
   — que frequentemente contêm dados pessoais (contratos, procurações, certidões) — em um
   registro público e imutável seria incompatível com a adjudicação do direito de exclusão do
   titular: em uma blockchain, o dado, uma vez gravado, não pode ser apagado.
3. **Propriedade.** O documento pertence ao titular, que decide quando, como e a quem
   entregá-lo. O sistema registra o fato, nunca sequestra o bem.

O hash não é uma "versão comprimida" do documento: é uma **impressão digital unidirecional**.
A partir do hash é impossível recuperar o arquivo, o que é precisamente o que torna o modelo
seguro do ponto de vista de privacidade.

---

## 2.2 Dados on-chain

### 2.2.1 Estrutura do registro

Todos os dados on-chain residem em uma única `struct`, declarada em
`contracts/CartorioNotarial.sol:12-22`. A seguir, campo a campo:

| Campo | Tipo Solidity | Origem do valor | Finalidade |
|-------|---------------|-----------------|------------|
| `documentHash` | `bytes32` | Parâmetro `_documentHash`, enviado pelo titular (SHA-256 do arquivo) | **Chave primária** do registro. Identifica univocamente o conteúdo. |
| `title` | `string` | Parâmetro `_title` | Identificação legível para o livro de registros. |
| `documentType` | `string` | Parâmetro `_documentType` (Contrato, Certidão, Procuração, Diploma, Log, Rastreabilidade, Escritura, Outro) | Classificação para consulta e auditoria. |
| `description` | `string` | Parâmetro `_description` | Observações livres de contexto. |
| `owner` | `address` | `msg.sender` (`:69`) — a carteira que assinou | Titularidade. Determina quem pode revogar. |
| `registeredAt` | `uint256` | `block.timestamp` (`:70`) | Carimbo temporal de registro. Também funciona como sentinela de existência (ver abaixo). |
| `isValid` | `bool` | Literal `true` no registro (`:71`); `false` na revogação (`:139`) | Situação notarial corrente. |
| `revocationReason` | `string` | Parâmetro `_reason` na revogação (`:140`) | Justificativa auditável da revogação. |
| `revokedAt` | `uint256` | `block.timestamp` na revogação (`:141`) | Carimbo temporal da revogação. `0` enquanto não revogado. |

Além da `struct`, o contrato mantém duas coleções:

| Coleção | Declaração | Função |
|----------|-----------|--------|
| `documents` | `mapping(bytes32 => DocumentRecord) private` (`:25`) | Armazenamento principal. Indexa o registro pelo hash, o que torna a verificação **O(1)**. |
| `allDocumentHashes` | `bytes32[] private` (`:28`) | Índice de enumeração, apenas-adição. Permite listar todos os documentos sem percorrer o mapping (que é irreversível) — é o que alimenta a aba **Explorador**. |

**Sentinela de existência.** O contrato não mantém um `bool exists`. Um registro é considerado
existente se, e somente se, `registeredAt != 0` (`:62`, `:108`, `:149`). Essa escolha evita
gasto de storage adicional e é coerente com o fato de que `block.timestamp` é praticamente
impossível de ser zero em uma transação real.

### 2.2.2 Volume e custo

| Métrica | Valor |
|---------|-------|
| Slots fixos de storage por registro | 1 (`documentHash` — `bytes32` ocupa um slot cheio) + 1 (`owner`, endereço empacotado) + 1 (`registeredAt`) + 1 (`isValid` empacotado com `revokedAt` no mesmo slot, por packing) |
| Storage dinâmico | `title`, `documentType`, `description`, `revocationReason` (encodings) |
| Crescimento total | 1 array element por registro; sem mecânica de exclusão (o registro permanece para sempre) |
| Efeito | O custo de gas cresce **linearmente** com o número de registros, e a chamada `verifyDocument` continua com custo **fixo**, por ser `view` |

O crescimento é deliberado: como nada é removido, o histórico é completo e o custo de
verificação não se degrada com o tempo.

---

## 2.3 Dados off-chain

| Dado | Onde fica | Persistência | Observações |
|------|-----------|--------------|-------------|
| **Arquivo original** (PDF, imagem, contrato) | Exclusivamente na máquina do titular | Permanente, fora do controle do sistema | Nunca é enviado ao backend nem à blockchain. O sistema não possui meio de recuperá-lo. |
| **Nome, tamanho e tipo MIME do arquivo** | Não são gravados em lugar nenhum do lado do servidor | Efêmero | Existem apenas no estado React do navegador, para exibição na interface (`RegisterDocument.jsx:190`). |
| **Certidão Notarial em PDF** | Gerada sob demanda em memória pelo PDFKit e enviada como *stream* | **Não persistida** | O arquivo é escrito direto na resposta HTTP (`backend/src/routes/notaryRoutes.js:91`) e descartado. A certidão é uma *derivação* do registro, não uma fonte independente: quem quiser conferi-la recalcula o hash ou consulta a blockchain. |
| **Nenhum dado pessoal (PII)** | — | — | Nenhum CPF, RG, endereço, telefone, e-mail ou nome de pessoa é coletado ou gravado. |

---

## 2.4 O que **não** é armazenado

A lista negativa é tão importante quanto a positiva, porque define a superfície de exposição
do sistema:

- ❌ O **conteúdo** de qualquer documento (texto, imagens, páginas).
- ❌ **Dados pessoais** de titulares ou terceiros (nome, CPF, RG, endereço, contato).
- ❌ **Chaves privadas** ou qualquer material criptográfico do titular — a assinatura ocorre
  dentro da MetaMask, e a chave nunca sai da extensão.
- ❌ **Cópias de backup** ou réplicas do documento em qualquer servidor do projeto.
- ❌ **Logs de transação** contendo o arquivo (não há, por construção: o arquivo nunca é
  transmitido).
- ❌ **Conta de usuário, sessão ou cadastro** — o sistema é inteiramente sem autenticação
  traditional; a carteira é a identidade.

Consequência prática: se a rede for apagada e o titular perder o arquivo, **não existe
recuperação possível** dentro do sistema. Essa é uma consequência coerente com a premissa de
propriedade declarada em [1.7](01-definicao-e-escopo.md#17-premissas-e-limites-de-confiança) —
e uma limitação que a seção [09](09-limitacoes-e-divergencias.md) discute com mais detalhe.
---

## Navegação

← [01 — Definição e Escopo](01-definicao-e-escopo.md) · Índice: [README](README.md) ·
Próxima: **[03 — Arquitetura do Sistema](03-arquitetura-do-sistema.md)**
