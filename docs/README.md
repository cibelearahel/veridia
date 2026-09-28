# Documentação Técnica — Veridia

> **Veridia — Cartório Distribuído**: aplicação descentralizada para registro público,
> carimbo de data/hora e verificação de integridade de documentos digitais em blockchain
> Ethereum local.

Este diretório reúne a documentação técnica do projeto, organizada como um **relatório
técnico** em dez seções, na ordem em que devem ser lidas.

---

## Seções do relatório

| # | Seção | Conteúdo |
|---|-------|----------|
| 01 | **[Definição e Escopo](01-definicao-e-escopo.md)** | Contextualização, definição do problema em cinco eixos, justificativa do uso de blockchain, objetivos, escopo incluído e **fora do escopo**. |
| 02 | **[Arquitetura de Dados](02-arquitetura-de-dados.md)** | O que é gravado **on-chain** (hash, metadados, titularidade, timestamps, eventos) e o que permanece **off-chain** (o arquivo original e a certidão em PDF), com o fluxo do dado, o que não é armazenado e as propriedades garantidas. |
| 03 | **[Arquitetura do Sistema](03-arquitetura-do-sistema.md)** | Organização do repositório, portas e decisões arquiteturais (AD1–AD8). |
| 04 | **[Smart Contract](04-smart-contract.md)** | `CartorioNotarial.sol`: storage, funções de escrita e leitura, regras de negócio, ciclo de vida do documento, eventos, decisões de projeto e limites. |
| 05 | **[Backend](05-backend.md)** | API Express: endpoints, `blockchainService` com *failover* de conexão, `certificateService` para a certidão em PDF, contrato de dados com o deploy. |
| 06 | **[Frontend](06-frontend.md)** | SPA React: `WalletContext` e integração com a MetaMask, os três painéis, cálculo de hash no navegador e sistema de design. |
| 07 | **[Conclusão](07-conclusao.md)** | Síntese, objetivos atingidos e considerações finais. |
---

## Documentos relacionados (fora de `docs/`)

| Arquivo | Função |
|---------|--------|
| [`../README.md`](../README.md) | Guia de instalação e execução |
| [`../SPECS.md`](../SPECS.md) | Especificação de requisitos — documento de **entrada** do trabalho, distinto deste relatório de **saída** |

---