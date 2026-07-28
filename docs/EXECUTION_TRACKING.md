# Execution Tracking (Snapshot Ativo + Ponte para Historico)

Data de revisao: 2026-07-28

## Objetivo
Manter uma leitura curta do estado operacional atual, das evidencias revalidadas no ciclo e dos riscos que ainda impedem confundir homologacao com producao real.

## Regra de uso
- Este arquivo registra snapshot ativo e evidencia recente.
- Este arquivo nao autoriza mudanca sozinho.
- O gatilho canonico de retomada da proxima sessao esta em `docs/NEXT_SESSION_TRIGGER.md`.
- Regra, escopo e precedencia continuam em `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`, `docs/EXECUTION_OPERATING_TEMPLATE.md` e no documento de dominio correspondente.
- Historico narrativo completo foi arquivado em `docs/archive/EXECUTION_TRACKING_HISTORY_2026-06-17.md`.

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
| Comunidade, campanhas e curadoria operacional | `PARCIAL` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` | `npm run qa:campaign:authority`, `npm run qa:campaign:impact`, `npm run qa:campaign:detail`; proximo candidato: `npm run qa:campaign:public` |
| Afiliacao e referral operacional | `PARCIAL` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` | `npm run qa:referral:authority`, `npm run qa:affiliate:referral` |
| Financeiro operacional e payouts internos | `IMPLEMENTADO` | `docs/PAYMENTS_DEFINITION_OF_DONE.md` | `npm run build`, `npm run qa:functional` |
| Pagamento real em producao | `PARCIAL` | `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` | `GO CONDICIONADO` |
| Migração e readiness de persistência | `IMPLEMENTADO LOCAL / PENDENTE EXTERNO` | `artifacts/audits/2026-07-19-w6-migration-backfill-readiness.md` | `npm run db:readiness:mysql` |
| Classificação do backfill legado | `BLOQUEADO POR ORIGEM NÃO COMPROVADA` | `artifacts/audits/2026-07-19-w7-backfill-classification.md` | `npm run db:backfill:authority:audit` |
| Preflight de promoção externa | `PRONTO PARA EVIDÊNCIA EXTERNA` | `artifacts/audits/2026-07-19-w8-external-promotion-preflight.md` | `npm run db:backfill:promotion:preflight` |

## Bloco 2 - Snapshot semanal ativo
### Dominio ativo do ciclo
- `FRONT_1_COMMUNITY_CAMPAIGNS` para endurecer campanhas e governanca dentro da capacidade `PARCIAL` provada, sem promover Organization ou movimento amplo.

### Proximos movimentos validos
1. Manter `qa:campaign:authority` como prova de autoridade e persistencia MySQL isolada de `Campaign` e `CampaignProduct`, sem promover os dominios alem de `PARCIAL` ou autorizar `CAMPAIGN_*_REPAIR`.
2. Manter `qa:campaign:impact` e `qa:campaign:detail` como provas isoladas do ciclo de governanca e detalhe de campanha; o proximo candidato e `qa:campaign:public`, somente apos investigacao e isolamento proprio de banco, cache derivado e artefatos.
3. Manter campanhas como `PARCIAL`; nao abrir `Organization`, membership madura, reward financeiro proprio ou rota paralela.
4. Manter `real-payments-cutover` como dependencia externa; so abrir quando a janela existir, com `p3:precheck` fora de `localhost`, seguido de `qa:stripe:smoke`, `qa:payments21:readiness`, `qa:provider:activate`, `qa:functional`, `qa:coreops` e `qa:matrix:audit`.
5. Preservar namespaces canonicos por papel, login server-side real e gate serial `qa:base:roles` em qualquer mudanca de rota, jornada, RBAC ou superficie cross-role.

### KPIs minimos do ciclo
- Base validada por `check`, `qa:routes`, `build`, `qa:functional`, `qa:role:journeys`, docs ativos sem alias morto, app tree sem shells legados e dashboard de `production_operator` sem CTA para namespace bloqueado.

## Bloco 3 - Evidencias P0 ativas
- 2026-07-28: `npm run qa:campaign:impact` passou contra MySQL QA local isolado em `useruah_qa_campaign_impact` (`localhost`), com schemas `001_payments.sql` e `002_distribution_authority.sql`. Usou somente `QA_DATABASE_URL`, distinta da base principal `useruah`; a campanha de prova existe uma vez na QA e zero vezes na principal. O ciclo provado foi criacao, submissao, bloqueio por revisao pendente, aprovacao da revisao, ativacao, pausa e reativacao, somente por endpoints de campanhas e revisoes de impacto. `.tmp-store/active-agent-plan.json` permaneceu ausente. A evidencia nao promove `Campaign` ou `CampaignProduct` alem de `PARCIAL`, nao autoriza `CAMPAIGN_*_REPAIR`, nao tocou pedido, checkout, pagamento ou webhook e nao iniciou T1.
- 2026-07-28: `npm run qa:campaign:detail` passou contra MySQL QA local isolado em `useruah_qa_campaign_detail`, usando exclusivamente `QA_DATABASE_URL`, distinta da base principal. O gate semeou identidades QA e validou login real por `/api/auth/login` com cookie `ruah_session`, bootstrap de catalogo, criacao de campanha, vinculo `CampaignProduct`, submissao, revisao de impacto e leituras autenticadas. Um segundo `community_manager` sem ownership recebeu `403`; header fallback nao foi autorizacao funcional. Nao tocou pedido, checkout, pagamento ou webhook; `active-agent-plan.json` permaneceu ausente, `.next` foi preservado, arquivos Next foram restaurados e o artefato QA foi removido. A prova mantem `Campaign` e `CampaignProduct` como `PARCIAL`, nao autoriza reparo de dominio nem inicia T1.
- 2026-07-25: `npm run qa:campaign:authority` passou contra MySQL QA local isolado, com migrations `001`/`002` e `QA_DATABASE_URL` distinta da base ambiente. A prova confirmou `Campaign` e `CampaignProduct` apos reinicio sem fallback local; `campaigns.json` e `campaign-products.json` foram restaurados. Isso nao promove os dominios alem de `PARCIAL`, nao autoriza `CAMPAIGN_*_REPAIR` e nao iniciou T1.
- 2026-07-25: FRONT_6 de continuidade diferencial concluida; `ACTIVE_FRONT`, `NEXT_SESSION_TRIGGER`, `.agents/session-state.json` e `agent-route` foram reconciliados. `e0df063` protege `ACTIVE_FRONT` contra espelho divergente e os caches derivados continuam sem autoridade.
- 2026-07-18: W1 de identidade durável registrada em `artifacts/audits/2026-07-18-w1-identidade-duravel.md`; build, login, cadastro, `registration/me`, cookie, ownership de pedido e login posterior passaram no MySQL local controlado, incluindo reinício do processo. HML e produção permanecem sem prova nesta rodada.
- 2026-07-18: W2 de autoridade única do catálogo registrada em `artifacts/audits/2026-07-18-w2-catalog-authority.md`; `catalog-item-store` deixou de usar `.tmp-store` como fallback em MySQL, superfícies públicas passaram a respeitar `CatalogItem`, e a prova de reinício com dado local obsoleto passou.
- 2026-07-18: W3 de autoridade relacional de `Artwork` e `ImpactReview` registrada em `artifacts/audits/2026-07-18-w3-artwork-impact-authority.md`; schema MySQL, adapters assíncronos, curadoria completa e prova de reinício sem fallback local passaram.
- 2026-07-18: W0 de baseline estrutural registrada em `artifacts/audits/2026-07-18-w0-baseline-autoridade-e-bloqueios.md`, confirmando 85 rotas de API, 29 stores locais, 18 adapters MySQL, fallback silencioso do catálogo, seleção implícita de SQLite e identidade não durável. A fila derivada prioriza fonte de verdade, sem abrir patch paralelo ou reabrir o cutover bloqueado.
- 2026-07-18: W4 de autoridade relacional de `Campaign` e `CampaignProduct` registrada em `artifacts/audits/2026-07-18-w4-campaign-distribution-authority.md`; vitrine pública, checkout, detalhe operacional e prova de reinício sem fallback local passaram.
- 2026-07-19: W5 de autoridade relacional de `ReferralLink` e `ReferralEvent` registrada em `artifacts/audits/2026-07-19-w5-referral-authority.md`; restart, clique, conversão idempotente, afiliado e atribuição combinada passaram.
- 2026-07-19: W6 de migração, backfill e readiness registrada em `artifacts/audits/2026-07-19-w6-migration-backfill-readiness.md`; migração `001`/`002` idempotente, ledger com checksum, readiness local e provas pós-build passaram. Backfill histórico não foi executado porque `.tmp-store` está misto e HML/produção não foram fornecidos.
- 2026-07-19: W7 de classificação registrada em `artifacts/audits/2026-07-19-w7-backfill-classification.md`; todos os 231 registros avaliados têm sinal de QA/teste, sem órfãos, duplicidades ou conflitos. Nenhum candidato foi aprovado para promoção.
- 2026-07-19: W8 preparou manifesto, checksum, escopo, backup/rollback e preflight externo; o template foi bloqueado por checksum placeholder, confirmando que a trava funciona sem conexão ou escrita.
- 2026-07-07: `npm run check`, `npm run build` e `npm run qa:payments21:readiness` -> `PASS`; gate forte validado com `ALLOW_HEADER_ACTOR_FALLBACK=false`, `ruah_session` real e webhook/idempotencia no recorte `Stripe/mysql`. `npm run qa:payments21` permanece como QA local/sandbox.
- 2026-06-21: `scripts/release/p3-cutover-evidence.mjs` passou a bloquear explicitamente `HML_BASE_URL` em `localhost`; `npm run p3:precheck` agora devolve `BLOCKED_EXTERNAL_BASE_URL` nesse cenario e evita leitura falsa de cutover pronto.
- 2026-06-21: `scripts/release/p3-plug-and-run.mjs`, `scripts/release/go-live-preflight.mjs` e `scripts/release/go-live-e2e-proof.mjs` passaram a bloquear `localhost` em dry-run; `npm run p3:plug`, `npm run go:preflight` e `npm run go:e2e:proof` deixaram de anunciar `READY_TO_EXECUTE` sem homolog final real.
- 2026-06-21: `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`, `docs/GO_LIVE_E2E_PROOF_RUNBOOK.md`, `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md` e `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` passaram a separar explicitamente baseline local aprovada de janela externa real ainda bloqueada.
- 2026-06-21: `docs/P3_ENV_READY_TO_FILL.md` e `docs/RUNBOOK_GO_LIVE.md` deixaram de sugerir execucao linear de cutover com `localhost`; os atalhos agora explicam quando o resultado correto e `BLOCKED_EXTERNAL_BASE_URL`.
- 2026-06-21: `docs/P3_HOMOLOG_CUTOVER_EVIDENCE_TEMPLATE.md` e `docs/CHECKLIST_RELEASE_PAGAMENTOS.md` deixaram de tratar `p3:precheck` como PASS genérico; agora exigem leitura coerente com ambiente real fora de `localhost`.
- 2026-06-21: `npm run check` -> `PASS`.
- 2026-06-21: `npm run qa:base:roles` -> `PASS`, revalidando `qa:routes`, `qa:blindspots`, `build`, `utf8:check`, `qa:product:guardrails` e a malha serial autenticada por papel.
- 2026-06-21: smoke local em `next start` -> `PASS` para `/`, `/journal` e `/register`; `/journal` deixou de expor `href="/journal/[id]"` inexistente.
- 2026-06-21: `app/journal/page.tsx`, `app/register/page.tsx` e `components/navigation/Footer.tsx` deixaram de insinuar detalhe editorial inexistente, termos/politicas sem destino real e icones com comportamento de CTA sem rota suportada.
- 2026-06-20: `affiliate-referral` ganhou controle operacional real de `ReferralLink` com pausa/reativacao em `app/api/affiliate/links/[id]/pause/route.ts`, `app/api/affiliate/links/[id]/activate/route.ts`, `lib/referral-store.ts` e `/affiliate/links`; `/af/[slug]` continua atribuindo apenas quando o link esta ativo.
- 2026-06-20: `qa:affiliate:referral` -> `PASS` em `QA_SERVER_MODE=dev`, com prova de pausa, fallback publico sem atribuicao, reativacao, clique persistido e conversao idempotente.
- 2026-06-20: `qa:role:closure` -> `PASS` em `QA_SERVER_MODE=dev`, respeitando a mesma malha de env do gate oficial (`PAYOUT_SECURITY_WINDOW_DAYS=0`, `AUTH_SESSION_SECRET=qa-local-session-secret`).
- 2026-06-20: `qa:community-curation` -> `PASS` em `QA_SERVER_MODE=dev`, com prova de ownership, autenticacao, escopo autoral e transicao `submitted -> under_review -> approved`.
- 2026-06-20: `qa:catalog:curation` -> `PASS` em `QA_SERVER_MODE=dev`, com prova de `artwork aprovado -> CatalogItem pending_review -> impact review -> ready -> published -> vitrine publica`.
- 2026-06-20: `app/community/campaigns/[id]/page.tsx` virou superficie acionavel por papel e estado, usando `submit`, `approve`, `pause` e `close` sem abrir rota ou regra nova.
- 2026-06-20: `docs/ACTIVE_FRONT.md`, `docs/NEXT_SESSION_TRIGGER.md`, `docs/EXECUTION_TRACKING.md` e `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md` consolidaram a sequencia serial `community-campaigns -> affiliate-referral -> catalogo-curadoria/artwork -> superficies publicas -> real-payments-cutover`.
- 2026-06-20: `app/artista/[slug]/page.tsx`, `app/category/[slug]/page.tsx`, `app/help-center/page.tsx` e `app/quem-somos/page.tsx` deixaram de sustentar promessas cenograficas ou copy publica corrompida.
- 2026-06-20: `npm run utf8:check` -> `PASS`.
- 2026-06-20: smoke local em `next dev` -> `PASS` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos`.
- 2026-06-20: `npm run check` -> `PASS`.
- 2026-06-18: `qa:routes`, `qa:blindspots`, `build` e `qa:base:roles` -> `PASS` no saneamento estrutural anterior.
- 2026-06-18: `HISTORICAL_REFERENCE` — `qa:campaign:impact`, `qa:campaign:detail`, `qa:community:revenue` e `qa:campaign:public` -> `PASS` naquele ciclo. Esta entrada nao substitui a evidencia vigente registrada para a sequencia atual.
- 2026-06-18: `qa:community-curation`, `qa:catalog:curation`, `qa:affiliate:referral` e `qa:role:closure` -> `PASS`, consolidando a cadeia `artwork -> catalogo -> campaignProduct -> campanha ativa -> storefront -> order snapshot -> conversao do affiliate`.
- 2026-06-18: `home`, `category`, `returns`, `policies` e `login` deixaram de prometer lookup publico, portal autonomo, login social inexistente ou vitrine paralela ao catalogo publicado.

Evidência W4: `artifacts/audits/2026-07-18-w4-campaign-distribution-authority.md` registra a autoridade MySQL local controlada de `Campaign` e `CampaignProduct`, com restart, vitrine pública, checkout e detalhe operacional aprovados.

## Risco residual real
- O runtime atual esta coerente com as rotas canonicas, mas varios documentos historicos ainda citam aliases antigos por contexto.
- Runners de QA que recompilam em paralelo no mesmo `.next` podem fabricar falha de ambiente; a referencia obrigatoria para a base atual passa a ser a execucao serial de `qa:base:roles`.
- Em Windows sandboxado, `next build` pode falhar com `spawn EPERM`; quando `build` e `qa:base:roles` passam fora do sandbox no mesmo working tree, isso deve ser tratado como ruido operacional do ambiente e nao como regressao do app.
- Os dominios `artwork`, `catalogo-curadoria`, `affiliate` e `CampaignProduct` seguem `PARCIAL`; o que fechou foi a coerencia minima de runtime, nao a maturidade plena da Fase 2.
- A mesa de governanca e o snapshot contextual de campanha melhoraram, mas ainda nao equivalem a dominio maduro de movimento, membership ou precificacao comunitaria ampla.
- `FRONT_4_PUBLIC_SURFACES_HONESTY` fechou o recorte atual, mas qualquer pagina editorial ou institucional nova ainda precisa passar pelo mesmo criterio para evitar reintroducao de fluxo cenografico.
- Sem seguir a serializacao nova, a tendencia natural e misturar frente interna resolvivel com bloqueio externo de homolog final e voltar a paralisar a execucao.
- `p3:precheck`, `p3:plug`, `go:preflight` e `go:e2e:proof` agora devem bloquear `localhost`; se qualquer um desses gates voltar a parecer liberado sem URL real, a leitura esta errada ou o script regrediu.
- Mencoes historicas a `/admin/support`, `/admin/production`, `/admin/finance/payouts` e `/finance/dashboard` sao apenas contexto e nao autorizam patch nem definem superficie viva.

## Regra de atualizacao
- Atualizar este arquivo apenas com snapshot atual, evidencias revalidadas no ciclo e risco residual objetivo.
- Nao reexpandir este arquivo com narrativa longa de execucao passada.
- Quando a informacao deixar de dirigir decisao atual, mover para `docs/archive/**` ou `docs/CHANGELOG_GOVERNANCE.md`.
