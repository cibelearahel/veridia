# 7 — Conclusão

> Seção 7 do relatório técnico do **Veridia — Cartório Distribuído**.

---

## 7.1 Síntese

O **Veridia** é uma aplicação descentralizada que desloca a função de âncora temporal do
cartório tradicional — de um registro relacional, centralizado e mutável — para uma estrutura
de dados imutável, pública e verificável por qualquer pessoa, sem custo.

A solução se sustenta sobre três decisões de projeto, escolhidas por razão de uma mesma
constatação: **nem todo dado de um registro notarial precisa estar na blockchain, e nem todo
dado de um registro notarial precisa de blockchain.**

1. **Só a âncora vai on-chain.** O hash SHA-256, os metadados essenciais, a titularidade
   criptográfica e os carimbos temporais ficam na rede. O documento permanece com o titular.
   Essa separação resolve simultaneamente três problemas distintos — o custo de gas, a
   conformidade com a LGPD e a propriedade do arquivo — e é coerente em todas as camadas do
   sistema: o contrato não tem como receber o arquivo, o backend não expõe rota em uso para
   recebê-lo, e a interface calcula o hash localmente pela Web Crypto API.
2. **As regras de negócio vivem no contrato.** Validação de hash, obrigatoriedade de título,
   unicidade do registro, controle de acesso à revogação e obrigação de justificativa estão
   todas em `CartorioNotarial.sol`. Não há uma única regra duplicada no backend ou no
   frontend. Consequência prática: um terceiro que ignore completamente a interface e chame o
   contrato diretamente obtém exatamente as mesmas garantias.
3. **Revogação em vez de exclusão.** Um documento cancelado tem seu status alterado, com
   motivo e data, mas o registro original permanece integralmente legível. A resposta
   normalmente correta a um cartório — revogar um ato, e não apagá-lo — coincide com a
   propriedade central da blockchain. Não existe função de exclusão no contrato.

---

## 7.2 Objetivos atingidos
| # | Objetivo | Situação | Evidência |
|---|----------|----------|-----------|
| O1 | Registro a partir do hash, vinculado ao titular e ao instante | **Atingido** | `registerDocument` com `owner = msg.sender` e `registeredAt = block.timestamp`; recibo com bloco e gas exibido na interface |
| O2 | Unicidade do registro | **Atingido** | `require` em `CartorioNotarial.sol:62`; teste de rejeição R1 com mensagem `Documento ja registrado anteriormente` |
| O3 | Verificação pública, gratuita e instantânea | **Atingido** | `verifyDocument` como `view`; verificável sem carteira nem gas, por hash colado ou por upload de arquivo |
| O4 | Revogação exclusiva do titular, com justificativa e histórico | **Atingido** | `revokeDocument` com `require(doc.owner == msg.sender)`; motivo obrigatório; registro preservado (testes R4 e V4) |
| O5 | Arquivo nunca transmitido para blockchain ou servidor | **Atingido** | `calculateFileSHA256` via `crypto.subtle`; nenhuma requisição com conteúdo de arquivo (teste I2) |
| O6 | Comprovação por certidão em PDF | **Atingido** | PDFKit gerando a certidão sob demanda, com hash, data, titular e situação (testes B6 e I10) |
| O7 | Auditoria pública do histórico | **Atingido** | O livro de registros e a listagem de blocos existem e são públicos. A atualização é feita por *polling* de 6 segundos.|

O objetivo geral — oferecer registro público, verificação aberta e revogação auditável, sem
intermediação cartorial e sem transmitir o conteúdo dos documentos — foi alcançado.

---

## 7.3 Considerações finais

A principal conclusão do trabalho é que a blockchain resolve **um** problema muito bem
definido — o registro imutável e publicamente auditável — e não "a questão notarial" como um
todo. A identidade do titular, o sigilo do conteúdo e a validade jurídica do documento
continuam exigindo mecanismos tradicionais. Reconhecer essa fronteira, e desenhar o sistema
dentro dela, é o que torna a proposta tecnicamente defensável: o Veridia não promete
autenticidade, promete **prova de existência e anterioridade**, e sustenta a promessa com
código verificável.

O Veridia demonstra que é possível oferecer verificação pública, gratuita e independente de um
registro documental sem depender de uma instituição que o detenha — e, nesse processo, sem
transferir para a rede uma única byte do documento que se quer proteger. A mesma separação que
torna o sistema privado é a que o torna barato e escalável. São as duas propriedades se
reforçando, não se opondo.

---

## Navegação

← [06 — Frontend](06-frontend.md) ·
Índice: [README](README.md) · Início: **[01 — Definição e Escopo](01-definicao-e-escopo.md)**
