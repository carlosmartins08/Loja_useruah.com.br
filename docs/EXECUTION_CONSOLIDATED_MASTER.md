# Execution Consolidated Master (Crosswalk Referencial)

Data de revisao: 2026-06-21

## Status deste arquivo
Este arquivo continua util como crosswalk amplo de navegacao e historico de governanca, mas nao e mais a fonte principal para:
- frente ativa
- retomada de sessao
- ordem serial de execucao do ciclo atual

Para isso, prevalece:
1. `docs/ACTIVE_FRONT.md`
2. `docs/NEXT_SESSION_TRIGGER.md`
3. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
4. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`

## Regra de uso deste arquivo
- ler este arquivo quando precisar localizar a familia certa de documentos
- nao usar este arquivo para arbitrar conflito entre docs vivos
- nao registrar aqui decisao nova que ja pertence a `docs/ACTIVE_FRONT.md`, `docs/NEXT_SESSION_TRIGGER.md`, `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md` ou `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`

## Objetivo
Eliminar conflitos e duplicidades entre documentos, definindo fonte por dominio, estados canonicos e regras de precedencia sem disputar a memoria operacional ativa.

## Regra de precedencia documental
1. `docs/ACTIVE_FRONT.md` para frente ativa e passo exato do ciclo
2. `docs/NEXT_SESSION_TRIGGER.md` para retomada obrigatoria
3. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md` para continuidade macro e plano executavel consolidado
4. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` para realidade e maturidade do runtime
5. documento de dominio especifico para regras normativas do dominio
6. `docs/README_DOCS_HIERARCHY.md` para navegacao documental
7. este arquivo apenas como governanca referencial complementar

Se houver divergencia, prevalece a fonte mais alta da lista acima.

## Fonte por dominio
- Passagem oficial Fase 1 -> Fase 2: `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- Escopo funcional oficial da Fase 2: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Frontend oficial da Fase 2: `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Backend oficial da Fase 2: `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Passagem oficial Fase 2 -> Fase 3: `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- Escopo funcional oficial da Fase 3: `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`
- Pagamento real e readiness operacional: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- Folha operacional da homolog final: `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- Cutover de pagamentos: `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- Pagamentos: `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- Pedidos e logistica: `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- Catalogo e curadoria: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Suporte e tickets: `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Permissoes e RBAC: `docs/ROLES_MATRIX.md`
- Localizacao tecnica: `docs/CODEBASE_MAP.md`

## Estados canonicos
Estados e transicoes canonicas seguem `docs/STATE_MACHINES.md`.

## Regras anti-conflito
- nao replicar a frente ativa neste arquivo
- nao reabrir sequencia oficial de execucao fora de `ACTIVE_FRONT` e `PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
- nao tratar roadmap como autorizacao de execucao
- nao tratar snapshot como regra primaria
- nao promover dominio `PARCIAL` para `IMPLEMENTADO` sem evidencia nova na matriz

## O que este arquivo ainda faz bem
- explicar precedencia ampla
- apontar fontes por dominio
- reforcar regras anti-duplicidade
- servir como referencia para governanca documental

## O que este arquivo nao deve mais fazer
- decidir qual frente esta ativa
- definir sozinho a ordem da proxima sessao
- competir com o snapshot ativo
- disputar autoridade com o plano mestre de continuidade

## Referencias obrigatorias
- `docs/DOCS_CLASSIFICATION.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/ACTIVE_FRONT.md`
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
