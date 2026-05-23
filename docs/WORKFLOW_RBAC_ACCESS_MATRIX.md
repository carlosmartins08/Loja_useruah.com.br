# Workflow RBAC Access Matrix (Operacional)

Data de revisao: 2026-05-23
Owner: Engenharia + Operacoes

## Objetivo
Padronizar o acesso por perfil nas jornadas criticas, evitando mistura entre experiencia de cliente e operacao de bastidor.

## Perfis
- `customer`
- `support_agent`
- `production_operator`
- `platform_admin`

## Matriz de acesso por rota

| Rota | customer | support_agent | production_operator | platform_admin |
| --- | --- | --- | --- | --- |
| `/account` | permitido | redireciona `/admin/support` | redireciona `/admin/production` | redireciona `/admin` |
| `/admin` | bloqueado -> `/account` | redireciona `/admin/support` | redireciona `/admin/production` | permitido |
| `/admin/support` | bloqueado -> `/account` | permitido | bloqueado -> `/admin/production` | permitido |
| `/admin/production` | bloqueado -> `/account` | bloqueado -> `/admin/support` | permitido | permitido |
| `/admin/eliv` | bloqueado -> `/account` | bloqueado -> `/admin/support` | bloqueado -> `/admin/production` | permitido |
| `/help-center` | permitido | permitido (institucional) | permitido (institucional) | permitido |

## Regras de sessão
- Sem sessão autenticada: rotas protegidas redirecionam para `/login`.
- Sessão inválida/tamperada: tratar como não autenticado e redirecionar para `/login`.
- Header fallback de ator:
  - permitido somente em dev (ou flag explícita `ALLOW_HEADER_ACTOR_FALLBACK=true`);
  - bloqueado por padrão em produção.

## Componentes de navegação
- Header e BottomNav direcionam o botão de conta por role:
  - `customer` -> `/account`
  - perfis operacionais -> `/admin`

## Critério de aceite
- Todos os perfis testados manualmente nas rotas da matriz.
- Nenhuma rota administrativa acessível por `customer`.
- Evidência de testes registrada em `docs/EXECUTION_TRACKING.md`.
