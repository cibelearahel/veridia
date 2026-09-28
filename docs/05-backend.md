# 05 — Backend

> Seção 5 do relatório técnico do **Veridia — Cartório Distribuído**.
> Descreve a API REST em Node.js/Express: estrutura, endpoints, serviços e o mecanismo de
> conexão com o nó local.

---

## 5.1 Visão geral

| Atributo | Valor |
|----------|-------|
| Linguagem | JavaScript (CommonJS) |
| Framework | Express 4.19 |
| Porta | `3001` (configurável por `PORT`) |
| Integração blockchain | Ethers v6 (`JsonRpcProvider`) |
| Geração de PDF | PDFKit 0.15 |
| Upload | Multer 1.4 (armazenamento em memória) |
| Dependências | `express`, `cors`, `multer`, `pdfkit`, `ethers`, `dotenv` (declarado, sem uso) |
| Scripts | `npm start` · `npm run dev` (com `--watch`) |

O backend cumpre três funções, e apenas três:

1. **Agregar leituras** — fornecer um formato estável para a interface consumir dados de várias
   chamadas ao contrato.
2. **Fornecer telemetria do nó** — status da rede e blocos recentes para o explorador.
3. **Gerar um derivado** — a certidão notarial em PDF.

Conforme AD3 em [03](03-arquitetura-do-sistema.md#36-decisões-arquiteturais), ele **não
assina transações** e **não valida regras de negócio**. Não há chave privada em lado nenhum
do servidor, o que torna o backend estruturalmente incapaz de alterar a base.

---

## 5.2 Estrutura

```text
backend/
├── package.json
└── src/
    ├── server.js                 # Bootstrap, middlewares, montagem das rotas
    ├── config/
    │   └── contractConfig.json   # Gerado pelo deploy.js (endereço + ABI)
    ├── routes/
    │   └── notaryRoutes.js       # Todos os endpoints REST
    └── services/
        ├── blockchainService.js  # Acesso à blockchain, somente leitura
        └── certificateService.js # Geração da certidão em PDF
```

A divisão segue o padrão de serviços: `routes` cuida de HTTP (parâmetros, status, cabeçalhos),
`services` cuida de lógica. Ambos os serviços são singletons exportados como instância
(`module.exports = new BlockchainService()`), o que garante que o *provider* JSON-RPC seja
criado uma única vez e reaproveitado entre requisições.

---

## 5.3 Endpoints

Todas as rotas de documentos são montadas sob o prefixo `/api/documents`
(`backend/src/server.js:16`). A rota de health check fica na raiz do servidor.

| # | Método | Rota | Descrição | Resposta |
|---|--------|------|-----------|----------|
| 1 | `GET` | `/health` | Verificação de saúde do serviço, com o estado da blockchain embutido. | `200` com `{ status, service, timestamp, blockchain }` |
| 2 | `POST` | `/api/documents/calculate-hash` | Recebe um arquivo e calcula SHA-256 e Keccak-256 no servidor. | `200` com `{ fileName, fileSize, mimeType, sha256Hash, keccakHash }` · `400` se nenhum arquivo |
| 3 | `GET` | `/api/documents` | Lista **todos** os documentos registrados. | `200` com array de documentos |
| 4 | `GET` | `/api/documents/:hash` | Consulta um documento pelo hash. | `200` com o documento · `404` `{ exists: false, message }` |
| 5 | `GET` | `/api/documents/:hash/certificate` | Gera e envia a certidão em PDF. | `200` `application/pdf` · `404` se não encontrado |
| 6 | `GET` | `/api/documents/blockchain/status` | Métricas de saúde do nó. | `200` com `{ online, rpcUrl, chainId, blockNumber, gasPriceGwei, contractConfigured, contractAddress, accounts }` |
| 7 | `GET` | `/api/documents/blockchain/blocks?limit=N` | Lista os `N` blocos mais recentes. | `200` com array de blocos · `N` padrão 10 |

### 5.3.1 Detalhamento das rotas relevantes

**`GET /api/documents` (rota 3)** — chama `getAllDocumentHashes()` e, para cada hash, executa
uma chamada `verifyDocument` (`blockchainService.js:156-171`). Isso significa `N + 1` chamadas
JSON-RPC para `N` documentos. É aceitável no contexto de uma base local de demonstração, mas
não escalaria: em uma base com milhares de documentos, a listagem completa em uma única
requisição seria um problema. Uma evolução natural seria paginação com `offset`/`limit` sobre
o array on-chain.

Em caso de erro, a rota retorna `[]` em vez de falhar (`:167-170`) — o explorador continua
funcionando, exibindo uma lista vazia, em vez de apresentar um erro. É uma escolha
deliberada de resiliência da interface.

**`GET /api/documents/:hash` (rota 4)** — delega a `getDocument`, que normaliza o resultado
em pt-BR, acrescentando `registeredDate` e `revokedDate` já formatados
(`blockchainService.js:149`, `:152`). O serviço converte `uint256` para `Number`, o que é
seguro para timestamps em segundos.

**`GET /api/documents/:hash/certificate` (rota 5)** — define os cabeçalhos antes de escrever
qualquer byte na resposta (`:85-89`):

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Certidao_Notarial_<10 primeiros chars do hash>.pdf"
```

Em seguida, entrega a resposta HTTP ao `certificateService`, que faz o *streaming* do PDF
direto para o socket. O PDF nunca é montado em memória por inteiro nem gravado em disco.

**`GET /api/documents/blockchain/*` (rotas 6 e 7)** — as duas rotas de blockchain ficam sob
o prefixo `/api/documents`, e não em `/api/blockchain`. Isso é uma consequência direta da
montagem (`server.js:16`) e significa que todo acesso à blockchain passa pelo prefixo de
documentos. Funciona, mas é um mapeamento levemente confuso.

A ordem de declaração das rotas não gera conflito: `GET /:hash` (rota 4) é declarada antes de
`/blockchain/status` (rota 6), mas como `/:hash` captura um único segmento de caminho e
`/blockchain/status` tem dois, o Express casa a rota correta. O caso degenerado
`GET /api/documents/blockchain` (sem o `/status`) seria interpretado como consulta de um
documento cujo hash fosse a palavra `"blockchain"` — situação que não ocorre na interface.

### 5.3.2 Middlewares e segurança

`server.js:11-13` aplica `cors()` com configuração padrão, o que libera o acesso de **qualquer
origem**, `express.json()` e `express.urlencoded({ extended: true })`.

A configuração aberta de CORS é adequada ao contexto de desenvolvimento — a API é local e o
frontend roda em `localhost:5173`. Em exposição pública, seria necessário restringir as
origens. Observa-se ainda que a API **não possui autenticação**: como todas as operações são
de leitura, não há dado protegido exposto, mas qualquer pessoa com acesso à porta poderia
consultar a base — o que, aliás, é intencional (ver O7 em
[01](01-definicao-e-escopo.md#14-objetivos)).

O `multer` opera em `memoryStorage` com limite de 50 MB (`:11-14`), o que evita escrita em
disco. O limite existe para impedir esgotamento de memória por um envio único.

---

## 5.4 `blockchainService` — acesso à blockchain

Responsável por todo o diálogo com o nó. É um singleton com *state* interno de provider.

### 5.4.1 Tolerância a falha na conexão

O serviço implementa *failover* entre as duas portas convencionais do Ganache
(`:9-11`):

```javascript
this.rpcUrls = [
  process.env.GANACHE_URL || "http://127.0.0.1:7545", // GUI
  "http://127.0.0.1:8545",                            // CLI
];
```

O fluxo de `getProvider()` (`:17-45`) é:

1. se já houver um provider em cache, testa-o com `getBlockNumber()`; se responder, reutiliza;
2. se o teste falhar, descarta o cache e **tenta reconectar** — o provider se auto-repara;
3. percorre a lista de URLs, instanciando um `JsonRpcProvider` para cada uma e testando-a;
4. se nenhuma responder, usa a primeira URL como fallback, sem provider válido.

Esse desenho permite que o backend seja iniciado **antes** do Ganache, sem travar. Ele
sobe normalmente e passa a se conectar assim que o nó ficar disponível. O `env` permite
apontar para um nó em outra porta via `GANACHE_URL`.

### 5.4.2 Métodos

| Método | Retorno | Observações |
|--------|---------|-------------|
| `getContractConfig()` | Objeto ou `null` | Lê e faz o *parse* de `config/contractConfig.json`; retorna `null` se o arquivo não existir ou estiver corrompido. |
| `getContract()` | `ethers.Contract` | Instancia um contrato **somente-leitura** (provider sem signer). Lança `Error` com a instrução `npm run deploy:ganache` se o contrato não estiver implantado (`:63`). |
| `getNetworkStatus()` | Objeto de status | Nunca lança: em falha, retorna `{ online: false, error, contractConfigured }` (`:95-101`). Isso permite que `/health` responda mesmo sem blockchain. |
| `getRecentBlocks(limit)` | Array de blocos | Percorre do *head* para trás chamando `getBlock(i)`. Converte o timestamp para data pt-BR. Em erro, retorna `[]` (`:127-130`). |
| `getDocument(hash)` | Objeto ou `null` | Chama `verifyDocument` e normaliza. Retorna `null` se `exists == false` (`:136-138`). |
| `getAllDocuments()` | Array | Agrega todos os documentos. Em erro, retorna `[]` (`:167-170`). |

Os últimos três métodos **engolem exceções e retornam valores neutros** (`[]` ou `null`).
Isso evita que uma indisponibilidade momentânea do nó derrube a interface do explorador, que
faz *polling* a cada 6 segundos — sem essa tolerância, qualquer falha transitória produziria um
erro visível na tela.

---

## 5.5 `certificateService` — certidão em PDF

Gera a certidão notarial em PDF A4 (margens de 45 pt), fazendo *streaming* direto para a
resposta HTTP.

| Aspecto | Implementação |
|---------|---------------|
| Biblioteca | PDFKit 0.15 |
| Formato | A4, margem 45 pt |
| Metadados do PDF | `Title`, `Author`, `Subject`, `Keywords` preenchidos a partir do documento |
| Paleta | `#0f172a` (slate-900), `#0284c7` (sky), `#059669` (emerald, válido), `#dc2626` (vermelho, revogado), `#475569` (slate-600) |
| Estrutura | Moldura dupla, cabeçalho centralizado em caixa alta ("REPÚBLICA FEDERATIVA DO BRASIL" / "CARTÓRIO NOTARIAL DISTRIBUÍDO"), painel arredondado de dados, seção de cláusula de auditoria, rodapé com instante de emissão |

O painel de dados (`printField`) exibe: **Título**, **Classificação**, **Data e Hora**,
**Titular** (em fonte monoespaçada, por ser um endereço), **Hash SHA-256**, **Situação
Notarial** e, quando o documento está revogado, **Motivo** e **Data da Revogação**.

A certidão é, portanto, uma **representação derivada** do registro on-chain. Ela não tem valor
probatório autônomo: quem quiser confirmar o documento recalcula o hash ou consulta o
contrato. O PDF é uma conveniência para o titular, e o sistema trata isso corretamente ao
mantê-lo descartável (ver [2.4](02-arquitetura-de-dados.md#24-dados-off-chain)).

---

## 5.6 Contrato de dados com o deploy

O backend lê `src/config/contractConfig.json`, arquivo gerado por `scripts/deploy.js:44-52`
com o endereço do contrato, o chain ID, o instante do deploy, o endereço do implantador e a
ABI completa.

Sem esse arquivo, `getContract()` lança um erro com a instrução de deploy
(`blockchainService.js:63`), e `getNetworkStatus()` reporta `contractConfigured: false` — o
que dispara, no `server.js:45`, o aviso:

```
⚠️ Smart Contract ainda não implantado. Execute 'npm run deploy:ganache'.
```

O bootstrap do servidor testa a conexão logo após o `listen` (`:37-52`), exibindo o nó
conectado e o bloco atual, ou um aviso caso o Ganache não esteja disponível. Isso torna o
diagnóstico de problemas de ambiente imediato, no terminal em que o backend foi iniciado.

---

## 5.7 Variáveis de ambiente

| Variável | Padrão | Efeito |
|----------|--------|--------|
| `PORT` | `3001` | Porta do servidor Express (`server.js:8`) |
| `GANACHE_URL` | `http://127.0.0.1:7545` | Primeira URL tentada pelo `blockchainService` |

A dependência `dotenv` está declarada em `backend/package.json:13`, mas **não é carregada em
nenhum ponto do código** e não existe arquivo `.env` no repositório. A configuração é feita por
variável de ambiente do shell. Isso está registrado em [09](09-limitacoes-e-divergencias.md).

---

## Navegação

← [04 — Smart Contract](04-smart-contract.md) · Índice: [README](README.md) ·
Próxima: **[06 — Frontend](06-frontend.md)**
