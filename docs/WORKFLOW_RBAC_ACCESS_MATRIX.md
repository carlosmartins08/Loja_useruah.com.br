# Workflow RBAC Access Matrix (Operacional)

Data de revisao: 2026-05-30
Owner: Engenharia + Operacoes

## Objetivo
Padronizar acesso por papel com namespaces canonicos por ambiente, evitando mistura entre cliente, operacao e cockpit administrativo.

## Perfis
- `customer`
- `artist`
- `community_manager`
- `affiliate`
- `supplier`
- `curator`
- `support_agent`
- `production_operator`
- `finance_admin`
- `platform_admin`

## Home canonica por papel
- `customer` -> `/account`
- `artist` -> `/artist`
- `community_manager` -> `/community`
- `affiliate` -> `/affiliate`
- `supplier` -> `/supplier`
- `curator` -> `/curation`
- `support_agent` -> `/support`
- `production_operator` -> `/production`
- `finance_admin` -> `/finance`
- `platform_admin` -> `/admin`

## Matriz de acesso por namespace
| Namespace | customer | artist | community_manager | affiliate | supplier | curator | support_agent | production_operator | finance_admin | platform_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/account/*` | permitido | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido (conta pessoal) | permitido |
| `/artist/*` | bloqueado | permitido | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido |
| `/community/*` | bloqueado | bloqueado | permitido | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido |
| `/affiliate/*` | bloqueado | bloqueado | bloqueado | permitido | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido |
| `/supplier/*` | bloqueado | bloqueado | bloqueado | bloqueado | permitido | bloqueado | bloqueado | bloqueado | bloqueado | permitido |
| `/curation/*` | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido | bloqueado | bloqueado | bloqueado | permitido |
| `/support/*` | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido | bloqueado | bloqueado | permitido |
| `/production/*` | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido | bloqueado | permitido |
| `/finance/*` | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | permitido | permitido |
| `/admin/*` | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado | bloqueado (exceto ferramentas explicitamente liberadas) | permitido |

## Rotas legadas (migracao)
- `/admin/support/*` -> `/support/*`
- `/admin/production/*` -> `/production/*`
- `/admin/finance/payouts` -> `/finance/payouts`
- `/finance/dashboard` -> `/finance`
- `/account/artist/*` -> `/artist/*`
- `/account/community/*` -> `/community/*`
- `/account/affiliate/*` -> `/affiliate/*`
- `/account/supplier/*` -> `/supplier/*`

## Superficies publicas de atribuicao
- `/c/[campaignId]` e `/af/[slug]` sao superficies publicas de captura de contexto.
- Elas nao concedem acesso operacional a nenhum papel.
- O efeito esperado delas e apenas carregar contexto valido para checkout e atribuicao posterior.

## Regras de sessao
- Sem sessao autenticada: rotas protegidas redirecionam para `/login`.
- Sessao invalida: tratar como nao autenticado.
- Header fallback de ator somente em dev/QA controlado.

## Criterio de aceite
- Guardas em `layout.tsx` por namespace e backend como fonte real de autorizacao.
- Nenhuma rota operacional acessivel por papel indevido.
- Rotas legadas redirecionando para destino canonico.
- Evidencia recente de validacao registrada em `docs/EXECUTION_TRACKING.md`.
- Regra normativa de rotas e acesso continua em `docs/ROUTES.md` e `docs/ROLES_MATRIX.md`.
