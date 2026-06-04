# Fase 1 - Checklist de Freeze

Data de revisao: 2026-06-04

## Objetivo
Congelar a Fase 1 para permitir preparacao da Fase 2 sem reabrir escopo, interface, fluxo mestre ou criterio de aceite da fase comercial atual.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua como fonte oficial de escopo da Fase 1.
- `docs/FASE_1_GO_NO_GO_CHECKLIST.md` continua como decisao operacional de liberacao.
- Este documento define o que fica congelado entre o fechamento da Fase 1 e o inicio controlado da Fase 2.

## Veredito atual
- Fase 1 local/homologada controlada: `FREEZE READY`
- Fase 2: `NAO INICIAR` antes de preservar os itens congelados abaixo

## 1. O que esta congelado

### 1.1 Fluxo mestre
Os passos abaixo nao podem mudar sem revalidar formalmente a Fase 1:
1. `admin_master` publica `CatalogItem`
2. `customer` compra em `/shop` -> `/product/[id]` -> `/cart` -> `/checkout`
3. sistema cria `Order` + `OrderItemSnapshot`
4. pagamento confirma o pedido
5. operacao registra envio/rastreio
6. cliente acompanha pedido em `/account`
7. suporte abre e responde ticket sem colateral

### 1.2 Rotas canonicas da Fase 1
Rotas ativas congeladas:
- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/account`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[id]`
- `/account/support`
- `/admin`
- `/admin/catalog`
- `/admin/orders`
- `/admin/shipments`
- `/admin/support`
- `/admin/registrations`

### 1.3 Regras de visibilidade congeladas
O cliente nao pode passar a ver:
- fornecedor interno
- custo interno
- margem
- enums tecnicos crus
- entidades operacionais internas

### 1.4 Linguagem de interface congelada
A interface ativa da Fase 1 deve continuar falando como:
- ecommerce
- pedido
- pagamento
- entrega
- suporte

Nao pode voltar a falar como:
- ecossistema multiator
- curadoria externa
- artist portal
- affiliate portal
- supplier portal
- payout cockpit

## 2. O que pode mudar sem reabrir a fase
- correcoes de bug sem alterar contrato funcional
- melhoria visual sem mudar semantica da fase
- hardening de testes, scripts e observabilidade
- preparacao tecnica para Fase 2 desde que fique fora da interface ativa
- rotas futuras mantidas no repositorio, desde que nao contaminem navegacao central da Fase 1

## 3. O que e proibido durante o freeze
- trocar rota canonica da Fase 1
- reintroduzir links de `artist`, `community`, `affiliate`, `supplier`, `finance` ou `curation` na interface principal
- reabrir onboarding multiator como parte da operacao ativa da fase
- alterar o fluxo de pedido para acomodar requisitos da Fase 2
- expor novos estados tecnicos ao cliente
- mudar contrato de checkout, ownership de pedido ou rastreio sem rerodar aceite completo

## 4. Gatilhos que quebram o freeze
Se qualquer item abaixo acontecer, o freeze foi quebrado e a Fase 1 precisa ser revalidada:
- falha em `npm run check`
- falha em `npm run build`
- falha em `npm run qa:functional`
- falha em `npm run qa:coreops`
- falha em `npm run qa:matrix:audit`
- retorno de links ou copy de superficies fora da fase na interface ativa
- regressao de RBAC, ownership ou rastreio

## 5. Checklist obrigatorio antes de abrir a Fase 2

| Item | Status esperado | Evidencia |
| --- | --- | --- |
| Escopo oficial da Fase 1 preservado | PASS | `docs/FASE_1_VENDA_DE_PRODUTO.md` |
| GO/NO-GO da Fase 1 preservado | PASS | `docs/FASE_1_GO_NO_GO_CHECKLIST.md` |
| Freeze sem regressao de interface ativa | PASS | auditoria visual e navegacional |
| `npm run check` | PASS | gate tecnico |
| `npm run build` | PASS | gate tecnico |
| `npm run qa:functional` | PASS | jornada publica e conta |
| `npm run qa:coreops` | PASS | pedido ponta a ponta |
| `npm run qa:matrix:audit` | PASS | coerencia documental minima |

## 6. Comando oficial de revalidacao do freeze
Executar em serie:

```text
npm run check
npm run build
npm run qa:functional
npm run qa:coreops
npm run qa:matrix:audit
```

## 7. Regra de entrada da Fase 2
A Fase 2 so pode comecar quando:
- este freeze estiver preservado
- os gates acima passarem
- a nova frente nao exigir reinterpretar a Fase 1
- qualquer rota, papel ou dominio novo entrar explicitamente como novo escopo, e nao como extensao silenciosa da fase atual

## 8. Decisao pratica
Se uma mudanca futura afetar:
- loja publica
- checkout
- ownership do pedido
- status/rastreio
- suporte
- RBAC entre `customer` e `admin_master`

entao essa mudanca nao e "preparacao para Fase 2".
Ela e alteracao da Fase 1 e deve ser tratada como tal.
