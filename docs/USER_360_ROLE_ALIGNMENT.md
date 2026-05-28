# User 360 Role Alignment (Fonte de Reconciliacao)

Data de revisao: 2026-05-27  
Owner: Produto + Engenharia + Operacoes

## Problema que evita retrabalho
Sem reconciliar papeis e jornadas entre docs de dominio, RBAC de rota e runtime de sessao, qualquer mudanca de UI/fluxo gera regressao em cadeia.

## Fontes consultadas
- `docs/ROLES_MATRIX.md`
- `docs/JOURNEY_MATRIX_BY_ROLE.md`
- `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`
- `docs/API_CONTRACTS.md`
- `docs/STATE_MACHINES.md`
- `docs/REGISTRATION_MATRIX_BY_ROLE.md`

## Mapa unico por papel (verdade operacional atual)
| Papel | Oficial em dominio | Em sessao/runtime | Em rota frontend | Em contratos/API | Estado consolidado |
| --- | --- | --- | --- | --- | --- |
| `customer` | Sim | Sim | Sim | Sim | Ativo |
| `artist` | Sim | Sim | Parcial | Sim | Parcial |
| `community_manager` | Sim | Sim | Parcial | Sim | Parcial |
| `supplier` | Sim | Nao | Nao | Sim | Planejado |
| `curator` | Sim | Nao | Nao | Sim | Planejado |
| `production_operator` | Sim | Sim | Sim | Sim | Ativo |
| `support_agent` | Sim | Sim | Sim | Sim | Ativo |
| `finance_admin` | Sim | Sim | Sim | Sim | Ativo |
| `platform_admin` | Sim | Sim | Sim | Sim | Ativo |

## Conclusoes objetivas
1. O dominio ja e multipapel, mas a experiencia de rotas ainda e parcialmente multipapel.
2. `supplier` e `curator` ja existem como contrato de negocio, porem sem sessao/rotas dedicadas no runtime atual.
3. `artist` e `community_manager` existem na sessao, mas ainda sem ambiente operacional completo de rota.

## Regras de execucao para nao quebrar
1. Nao abrir rota nova para papel sem permissao de backend por acao critica.
2. Nao promover status `Ativo` para papel sem trilha de auditoria e jornada minima.
3. Nao alterar matriz de imagem/conteudo em paralelo com mudanca de RBAC (um risco por PR).

## Ordem obrigatoria de implementacao (anti-cascata)
1. Consolidar sessao multipapel (`roles[]`, `activeRole`) com troca auditada.
2. Consolidar autorizacao de backend por matriz central de permissao.
3. Liberar rota por papel somente apos smoke + contrato + estado valido.
4. Entao refinar UI por papel (menu, dashboard, formularios, impacto).

## Gate de PR (obrigatorio quando alterar papel/permissao)
- Papel afetado:
- Fonte de verdade atualizada (`ROLES_MATRIX`, `WORKFLOW_RBAC_ACCESS_MATRIX`, `REGISTRATION_MATRIX_BY_ROLE`):
- Contrato/API afetado:
- Evidencia de `actor_role` em auditoria:
- Resultado de smoke por papel:
