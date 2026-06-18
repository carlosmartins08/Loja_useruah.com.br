# Execution Tracking (Snapshot Ativo + Ponte para Historico)

Data de revisao: 2026-06-18

## Objetivo
Manter uma leitura curta do estado operacional atual, das evidencias revalidadas no ciclo e dos riscos que ainda impedem confundir homologacao com producao real.

## Regra de uso
- Este arquivo registra snapshot ativo e evidencia recente.
- Este arquivo nao autoriza mudanca sozinho.
- O gatilho canonico de retomada da proxima sessao esta em:
  - `docs/NEXT_SESSION_TRIGGER.md`
- Regra, escopo e precedencia continuam em:
  - `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
  - `docs/EXECUTION_OPERATING_TEMPLATE.md`
  - documento de fase, readiness ou dominio correspondente
- Historico narrativo completo foi arquivado em:
  - `docs/archive/EXECUTION_TRACKING_HISTORY_2026-06-17.md`

## Snapshot executivo atual
- Fase 1 comercial local/homologada controlada: `GO`
- Venda real em producao: `GO CONDICIONADO`
- Limpeza estrutural de rotas e jornadas por papel: `IMPLEMENTADO`
- Autoridade de RBAC tipada + jornada autenticada por papel: `IMPLEMENTADO`
- Legado de rotas antigas no app tree: removido; compatibilidade mantida apenas por redirect transitorio normativo

## Bloco 1 - Matriz de Status
| Frente | Status | Fonte principal | Evidencia ativa |
| --- | --- | --- | --- |
| Ecommerce publico + conta do cliente | `IMPLEMENTADO` | `docs/FASE_1_VENDA_DE_PRODUTO.md` | `npm run qa:functional` |
| RBAC, namespaces canonicos e dashboards por papel | `IMPLEMENTADO` | `docs/ROUTES.md`, `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md` | `npm run qa:routes`, `npm run qa:role:journeys` |
| Fechamento operacional de `artist`, `community_manager` e `affiliate` | `IMPLEMENTADO` | `docs/JOURNEY_MATRIX_BY_ROLE.md`, `docs/USER_360_ROLE_ALIGNMENT.md` | `npm run qa:role:closure` |
| Producao com escopo estrito para `supplier` | `IMPLEMENTADO` | `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`, `docs/ROLES_MATRIX.md` | `npm run qa:coreops` |
| Comunidade, campanhas e curadoria operacional | `PARCIAL` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` | `npm run qa:community-curation` |
| Afiliacao e referral operacional | `PARCIAL` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` | `npm run qa:affiliate:referral` |
| Financeiro operacional e payouts internos | `IMPLEMENTADO` | `docs/PAYMENTS_DEFINITION_OF_DONE.md` | `npm run build`, `npm run qa:functional` |
| Pagamento real em producao | `PARCIAL` | `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` | `GO CONDICIONADO` |

## Bloco 2 - Snapshot semanal ativo
### Dominio ativo do ciclo
- `ui-rotas`
- `rbac`
- `qa por papel`
- `governanca documental`

### Proximos movimentos validos
1. Preservar namespaces canonicos por papel como unica referencia interna.
2. Manter alias legado apenas como redirect transitorio, nunca como page montada.
3. Validar jornadas autenticadas por papel com login server-side e cookie real, sem depender de header fallback.
4. Executar a malha serial `qa:base:roles` antes de liberar mudanca em RBAC, rota ou dashboard.
5. Usar `docs/EXECUTION_TRACKING.md` so para snapshot e evidencias recentes.
6. Mandar historico narrativo e contexto antigo para `docs/archive/**` ou `docs/CHANGELOG_GOVERNANCE.md`.

### KPIs minimos do ciclo
- Gates do ciclo fechados: `check`, `qa:routes`, `build`, `qa:functional`, `qa:role:journeys`
- Documentos ativos de fase sem alias morto: `PASS`
- Paginas legadas montadas removidas do app tree: `PASS`
- Dashboard de `production_operator` sem CTA para namespace bloqueado: `PASS`

## Bloco 3 - Evidencias P0 ativas
Revalidado neste ciclo:
- 2026-06-18: `npm run check` -> `PASS`
- 2026-06-18: `npm run qa:routes` -> `PASS`
- 2026-06-18: `npm run qa:blindspots` -> `PASS`
- 2026-06-18: `npm run build` -> `PASS`
- 2026-06-18: `npm run qa:base:roles` -> `PASS`
- 2026-06-18: `npm run qa:campaign:impact` -> `PASS` com prova de `scope=campaigns`, aprovacao, pausa e reativacao na mesma esteira de governanca
- 2026-06-18: `npm run qa:campaign:detail` -> `PASS` com prova de ownership, leitura por `curator/platform_admin`, timeline normalizada e readiness backend em `GET /api/campaigns/[id]`
- 2026-06-18: `npm run qa:community:revenue` -> `PASS` com prova de atribuicao real por campanha em `/api/commissions/me/campaigns` e coerencia com ledger agregado da comunidade

Revalidado no mesmo saneamento estrutural:
- 2026-06-18: `npm run qa:role:journeys` -> `PASS`
- 2026-06-18: `npm run qa:community-curation` -> `PASS` com prova de `401` anonimo em `artworks`, escopo autoral por `authorId`, `start-review` obrigatorio, aprovacao restrita a curadoria e vinculo real de `CatalogItem` publicado na vitrine da campanha
- 2026-06-18: `npm run qa:catalog:curation` -> `PASS` com prova de `artwork aprovado -> CatalogItem pending_review -> impact review aprovado -> ready -> published -> vitrine publica`
- 2026-06-18: `npm run qa:affiliate:referral` -> `PASS` com prova de `401/403`, criacao de link por owner, redirect publico em `/af/[slug]`, clique persistido, conversao idempotente e leitura por `platform_admin`
- 2026-06-18: `npm run qa:role:closure` -> `PASS` com prova integrada de `artwork -> catalogo -> campaignProduct -> campanha ativa -> storefront filtrada -> regra progressiva 2-5=5% -> bloqueio de checkout fora da campanha -> order snapshot com movementMarkup + priceCompositionVersion -> payment -> ship -> ledger/payout de artist e community -> conversao automatica do affiliate`
- 2026-06-18: `npm run build` + validacao visual local em `artifacts/home-runtime-check.png` e `artifacts/category-autoral-runtime-check.png` -> home e categoria passaram a ler o catalogo publicado real, sem vitrine vendavel paralela
- 2026-06-18: `npm run check` + `npm run build` + smoke runtime servido por `next start` em `http://127.0.0.1:3343/` -> home passou a exibir CTA/editorial novo (`Ver Catalogo Publicado`, `Abrir Journal`, `Leituras da Colecao`), `help-center` removeu contato fake e `product/[id]` passou a apontar CTA flutuante para `/help-center`
- 2026-06-18: `npm run check` + `npm run build` + smoke runtime servido por `next start` em `http://127.0.0.1:3344/` -> `/returns` deixou de simular lookup publico e passou a orientar por pedido autenticado, `/policies` trocou CTA de portal autonomo por instrucoes reais e `/quem-somos` deixou de vender papel institucional acima do runtime atual
- 2026-06-18: `npm run check` + `npm run build` + smoke runtime servido por `next start` em `http://127.0.0.1:3345/login` -> `/login` removeu botoes falsos de Google/GitHub, passou a declarar acesso nativo por email/senha e deixou de insinuar login social inexistente
- 2026-06-18: saneamento documental ativo da Fase 2 -> `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` passou a separar superficies comprovadas de superficies apenas planejadas; `/@username*` e `/affiliate/rewards` deixam de aparecer como mapa pratico de continuidade
- 2026-06-18: `npm run qa:community-curation` + `npm run qa:base:roles` -> rejeicao de `impact review` de campanha agora devolve a campanha para `rejected`, expõe `decisionReason` em `/api/campaigns` e torna `/community/campaigns` uma superficie com devolutiva operacional real para o owner
- 2026-06-18: `npm run qa:campaign:impact` + `npm run qa:base:roles` -> `/admin/impact-reviews` passou a ter recorte proprio de campanhas com filtro por `entityType=Campaign`, contexto de runtime da campanha e caminho direto de moderacao final; `/community/campaigns` deixou de apontar owner para rota administrativa bloqueada
- 2026-06-18: `npm run qa:coreops` -> `PASS`
- 2026-06-18: `npm run qa:crossrole:impact` -> `PASS`
- 2026-06-18: `npm run qa:matrix:audit` -> `PASS`
- 2026-06-18: `npm run qa:campaign:detail` + `npm run qa:community:revenue` + `npm run qa:base:roles` -> campanha ganhou contrato unico de detalhe operacional em `/api/campaigns/[id]` e `/community/campaigns/[id]`; comunidade passou a ler receita por campanha sem inventar payout isolado

## Risco residual real
- O runtime atual esta coerente com as rotas canonicas, mas varios documentos historicos ainda citam aliases antigos por contexto.
- Runners de QA que recompilam em paralelo no mesmo `.next` podem fabricar falha de ambiente; a referencia obrigatoria para a base atual passa a ser a execucao serial de `qa:base:roles`.
- Em Windows sandboxado, `next build` pode falhar com `spawn EPERM` mesmo depois de compilar. Como `build` e `qa:base:roles` passaram fora do sandbox no mesmo working tree em 2026-06-18, isso deve ser tratado como ruido operacional do ambiente e nao como regressao do app.
- O dominio de `artwork` continua `PARCIAL`, mas agora ja diferencia falta de sessao de falta de permissao, respeita a etapa `submitted -> under_review -> approved/rejected` e tem prova de ownership/autorizacao no gate `qa:community-curation`.
- O dominio `catalogo-curadoria` avancou em prova integrada real, mas ainda nao deve ser tratado como fechado enquanto o fluxo de operacao criativa de artista e a camada de acervo final continuarem parciais.
- As superficies operacionais de `artist`, `community_manager` e `affiliate` agora fecham no runtime com atribuicao real e prova ativa; o que segue parcial e o dominio mais amplo da Fase 2, nao mais a coerencia basica desses papeis.
- `CampaignProduct` deixou de ser so intencao documental e virou runtime parcial real, mas ainda nao equivale a um dominio maduro de movimento, membership ou precificacao comunitaria completa.
- A rejeicao de governanca de campanha deixou de prender o owner num limbo opaco: agora o runtime devolve a campanha para `rejected` com motivo visivel, mas a moderacao de campanha continua parcial enquanto nao existir uma superficie dedicada mais rica para decisao e historico.
- A mesa de governanca ja ganhou um recorte proprio de campanhas com historico e contexto, mas isso ainda nao equivale a um dominio pleno de movimento ou a uma esteira ampla de moderacao multi-etapa fora da rota canonica atual.
- O dominio de afiliacao continua parcial como fase porque ainda nao existe ledger/reward financeiro proprio; o que existe de forma comprovada e o tracking real de link, clique, snapshot e conversao automatica.
- O snapshot contextualizado da Fase 2 avancou para composicao real de preco de campanha no pedido, mas isso ainda nao equivale a um dominio maduro de `Organization`, membership ou regras comerciais mais amplas de movimento.
- As superficies publicas `/` e `/category/[slug]` deixaram de vender por card estatico, mas a ordenacao comercial dessas vitrines ainda e simples e nao deve ser confundida com motor de merchandising maduro.
- As principais superficies publicas de entrada agora tambem deixaram de prometer personalizacao self-service, canais externos e contatos oficiais nao sustentados pelo runtime; o risco remanescente passa a ser encontrar copy futura ou aspiracional em paginas publicas ainda nao auditadas neste mesmo criterio.
- A frente publica ficou bem mais honesta, mas ainda vale auditar outras paginas editoriais ou institucionais novas com o mesmo criterio para evitar reintroducao de fluxo cenografico.
- A documentacao ativa da Fase 2 ficou menos propensa a reabrir escopo errado, mas ainda exige disciplina para nao transformar rotas planejadas em backlog presumido sem atualizar antes a matriz.
- Mencoes historicas a `/admin/support`, `/admin/production`, `/admin/finance/payouts` e `/finance/dashboard` sao evidencia de contexto e nao descrevem o runtime canonico atual.
- Essas citacoes historicas nao autorizam patch nem definem superficie viva.
- Qualquer nova limpeza documental deve preservar a fronteira:
  - `docs/**` ativo para regra, snapshot e redirecionador util
  - `docs/archive/**` para historico sem autoridade atual

## Regra de atualizacao
- Atualizar este arquivo apenas com:
  - snapshot atual
  - evidencias revalidadas no ciclo
  - risco residual objetivo
- Nao reexpandir este arquivo com narrativa longa de execucao passada.
- Quando a informacao deixar de dirigir decisao atual, mover para:
  - `docs/archive/**`; ou
  - `docs/CHANGELOG_GOVERNANCE.md`, se o ponto for decisao e nao evidencia.
