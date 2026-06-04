# Fase 1 - Checklist de GO / NO-GO

Data de revisao: 2026-06-03

## Regra de uso
- Este checklist serve para decidir se a Fase 1 comercial pode operar sem reabrir escopo.
- Cada item deve ser marcado como `GO`, `GO condicionado` ou `NO-GO`.
- `GO condicionado` so e aceitavel quando o risco nao bloqueia venda, nao expoe dado sensivel e possui dono com prazo.
- Qualquer item critico em `NO-GO` bloqueia liberacao comercial.

## Decisao final
- `GO`: todos os itens criticos em `GO`
- `GO condicionado`: no maximo 2 itens nao criticos em `GO condicionado`, com dono e prazo
- `NO-GO`: qualquer falha em compra, pagamento, ownership do pedido, envio, rastreio ou acesso

## 1. Escopo travado

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Fonte oficial da fase e `docs/FASE_1_VENDA_DE_PRODUTO.md` | critica | GO | documento oficial ativo | n/a | n/a |
| Matriz de execucao esta alinhada ao codigo atual | critica | GO | `docs/FASE_1_MATRIZ_EXECUCAO.md` | n/a | n/a |
| Nenhuma feature fora da fase foi reaberta no fechamento | critica | GO | auditoria do fluxo mestre | n/a | n/a |

## 2. Fluxo de venda

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Produto publicado aparece em `/shop` e `/product/[id]` | critica | GO | `qa:functional` em `start` | n/a | n/a |
| Carrinho leva ate checkout sem quebra | critica | GO | `qa:functional` em `start` | n/a | n/a |
| Checkout cria pedido real vinculado ao cliente autenticado | critica | GO | `qa:coreops` | n/a | n/a |
| Reenvio com mesma `x-idempotency-key` nao cria novo pagamento | critica | GO | `qa:coreops` | n/a | n/a |
| Pagamento aprovado move o pedido no fluxo correto | critica | GO | `qa:coreops` | n/a | n/a |

## 3. Ownership e seguranca

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Cliente ve apenas os proprios pedidos | critica | GO | `qa:coreops` com `403` em acesso cruzado | n/a | n/a |
| Cliente nao recebe payload interno de catalogo | critica | GO | hardening em `GET /api/catalog-items` | n/a | n/a |
| Acoes operacionais exigem role valida | critica | GO | `qa:coreops` bloqueando `start` sem ator | n/a | n/a |

## 4. Operacao do pedido

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Producao nao inicia antes do pagamento | critica | GO | `qa:coreops` | n/a | n/a |
| Producao inicia apos pagamento aprovado | critica | GO | `qa:coreops` | n/a | n/a |
| Envio registra transportadora e rastreio | critica | GO | `qa:coreops` | n/a | n/a |
| Cliente acompanha status e rastreio em `/account` | critica | GO | `qa:coreops` + pagina de detalhe | n/a | n/a |

## 5. Suporte minimo

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Cliente abre ticket para pedido proprio | media | GO | `qa:coreops` | n/a | n/a |
| Suporte responde ticket | media | GO | `qa:coreops` | n/a | n/a |
| Ticket nao altera estado operacional por acidente | critica | GO | `qa:coreops` mantendo `shipped` | n/a | n/a |

## 6. Gates tecnicos

| Item | Criticidade | Status | Evidencia | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| `npm run check` | critica | GO | PASS em 2026-06-03 | n/a | n/a |
| `npm run build` | critica | GO | PASS em 2026-06-03 | n/a | n/a |
| `npm run qa:matrix:audit` | critica | GO | PASS em 2026-06-03 | n/a | n/a |
| `qa:functional` em `start` | critica | GO | PASS em 2026-06-03 | n/a | n/a |
| `qa:coreops` | critica | GO | PASS em 2026-06-03 | n/a | n/a |

## 7. Pendencias fora do corte

| Item | Criticidade | Status | Observacao | Dono | Prazo |
| --- | --- | --- | --- | --- | --- |
| Gateway real de producao | critica para venda real | GO condicionado | fase local fechada, mas cutover real depende de runbook e credenciais | produto + engenharia | antes de go-live real |
| Webhook real exposto em ambiente final | critica para venda real | GO condicionado | nao bloqueia homologacao local, bloqueia operacao comercial real | engenharia | antes de go-live real |
| Observabilidade de producao externa | media | GO condicionado | nao bloqueia prova local, mas deve existir antes de escala | engenharia | antes de go-live real |

## Veredito atual
- Fase 1 comercial: `GO` em ambiente local/homologado controlado
- Venda real em producao: `GO condicionado`
- Condicao para virar `GO` real:
  - cutover do gateway real concluido
  - webhook real validado
  - checklist de go-live operacional assinado
