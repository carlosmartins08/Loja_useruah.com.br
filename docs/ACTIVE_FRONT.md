# Active Front

Data de revisao: 2026-07-29
Branch: `main`
Responsavel atual: `Codex + usuario`
Status da frente: `FRONT_3_CATALOG_CURATION_HARDENING` — `ATIVA`

## Objetivo atual
Iniciar somente a leitura e o recorte tecnico de catalogo e curadoria, sem implementacao direta e sem promover capacidades parciais a maturidade.

## Gatilho rapido de retomada
Se a sessao cair ou for retomada depois:
1. abrir `docs/NEXT_SESSION_TRIGGER.md` como ponto de entrada canonico;
2. confirmar `frente ativa`, `ultimo passo executado`, `evidencia` e `proximo passo exato`;
3. recusar qualquer desvio que pule essa leitura.

## Frente unica aberta
Frente atual selecionada:
- `FRONT_3_CATALOG_CURATION_HARDENING`

Estado operacional:
- FRONT_1_COMMUNITY_CAMPAIGNS permanece PARCIAL/PAUSADA, conscientemente limitada por BLOCKED_BY_MISSING_AUTHORIZED_NEXT_GATE, e nao esta DONE.
- Campaign/CampaignProduct permanecem PARCIAL.
- qa:community:revenue permanece limitado a community_campaign_revenue_read_ownership_only; nao valida order, checkout, payment, webhook, production, shipping, referral ou attribution.
- FRONT_3_CATALOG_CURATION_HARDENING e a nova frente ativa por autorizacao humana explicita.

Motivo:
- `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT` concluiu a reconciliacao entre `ACTIVE_FRONT`, `NEXT_SESSION_TRIGGER`, `.agents/session-state.json` e o roteador.
- W1-W8 permanecem historico processado; W7/W8 continuam limitados as evidencias existentes e nao afirmam homologacao externa.
- A autorizacao humana escolheu `FRONT_3_CATALOG_CURATION_HARDENING` como o menor proximo recorte seguro para fortalecer catalogo, curadoria e produto publicavel antes de qualquer expansao financeira, de referral ou de superficies mais amplas.
- `FRONT_5_REAL_PAYMENTS_CUTOVER` continua bloqueada por dependencia externa e nao e a frente ativa.

Recorte atual em execucao:
- `Artwork`, catalogo-curadoria e `CatalogItem` no perimetro parcial ja documentado.
- o proximo passo e leitura e recorte tecnico da FRONT_3, nao implementacao direta.
- financeiro, checkout, pagamento, webhook, producao/envio, referral e attribution nao entram neste recorte.

## Plano serial de execucao
1. `FRONT_1_COMMUNITY_CAMPAIGNS`
Problema real: campanhas e governanca ja funcionam, mas ainda nao devem ser tratadas como dominio fechado.
Usuarios/roles: `community_manager`, `curator`, `platform_admin`.
Fonte autoritativa: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`.
Gate de saida: `npm run qa:campaign:impact`, `npm run qa:campaign:detail`, `npm run qa:community:revenue` e `npm run qa:base:roles`.
Nao tocar: `Organization` madura, reward financeiro de afiliado, rotas novas por fora dos namespaces canonicos.

2. `FRONT_2_AFFILIATE_REFERRAL`
Problema real: atribuicao existe, mas o dominio ainda corre risco de ser lido como payout proprio.
Usuarios/roles: `affiliate`, `platform_admin`.
Fonte autoritativa: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`.
Gate de saida: `npm run qa:affiliate:referral` e `npm run qa:role:closure`.
Nao tocar: `affiliate/rewards`, saldo sacavel proprio, ledger financeiro novo.

3. `FRONT_3_CATALOG_CURATION_HARDENING`
Problema real: `artwork` e `catalogo-curadoria` ainda estao `PARCIAL`, apesar de ja sustentarem o fluxo publicado atual.
Usuarios/roles: `artist`, `curator`, `platform_admin`.
Fonte autoritativa: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`, `docs/EXECUTION_TRACKING.md`.
Gate de saida: `npm run qa:community-curation`, `npm run qa:catalog:curation` e `npm run qa:role:closure`.
Nao tocar: produto paralelo, checkout paralelo, expansao autonoma de Fase 3.

4. `FRONT_4_PUBLIC_SURFACES_HONESTY`
Problema real: ainda pode existir copy, CTA ou pagina publica prometendo runtime que nao existe.
Usuarios/roles: `visitor`, `customer`.
Fonte autoritativa: `docs/FASE_1_VENDA_DE_PRODUTO.md`, `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/ROUTES.md`.
Gate de saida: `npm run check`, `npm run build` quando houver impacto estrutural, e smoke dirigido das paginas tocadas.
Nao tocar: regra de negocio em `context/**` ou `hooks/**`, login social, portal autonomo ficticio, namespace novo.

5. `FRONT_5_REAL_PAYMENTS_CUTOVER`
Problema real: pagamento real segue `GO CONDICIONADO` por dependencia externa de homolog final e cutover.
Usuarios/roles: `finance_admin`, `platform_admin`, `customer`.
Fonte autoritativa: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`, `docs/PAYMENTS_DEFINITION_OF_DONE.md`.
Gate de saida: `npm run p3:precheck`, `npm run qa:stripe:smoke`, `npm run qa:payments21`, `npm run qa:provider:activate`, `npm run qa:functional`, `npm run qa:coreops`, `npm run qa:matrix:audit` e evidencia da janela real.
Nao tocar: redesign de checkout, fase nova de produto, workaround de ambiente travestido de feature.

6. `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT`
Problema real: a memoria operacional ainda aponta para pagamentos e o plano do agente ainda termina em W6, apesar de W1-W8 ja estarem registrados em evidencias existentes.
Usuarios/roles: nenhum; esta e uma frente de governanca de continuidade.
Fonte autoritativa: este arquivo, `.agents/session-state.json`, `docs/NEXT_SESSION_TRIGGER.md`, `docs/EXECUTION_TRACKING.md` e `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`.
Gate de saida: `npm run test:agent-route`, `npm run check` e `git diff --check`.
Nao tocar: produto, checkout, carrinho, pedido, pagamento, webhook, catalogo, banco, admin, account, IA de cliente, README ou componentes visuais.

## Regra de passagem entre frentes
- So avancar para a proxima frente quando a atual terminar em `IMPLEMENTADO`, `PARCIAL` conscientemente limitado ou `BLOQUEADO` por dependencia externa objetiva.
- Nao abrir duas frentes no mesmo patch.
- Se surgir conflito entre frente atual e documento fonte, corrigir o documento fonte no mesmo ciclo ou parar.
- Se a mesma prova local repetir o mesmo bloqueio duas vezes sem aprendizado novo, registrar a limitacao e pivotar de forma consciente em vez de prolongar o loop.

## Ja concluido
- Base estrutural do ciclo anterior estabilizada no recorte ativo.
- `RBAC`, namespaces canonicos por papel e `qa:base:roles` tratados como verdades fechadas.
- Campanha publica, detalhe operacional de campanha, receita por campanha e referral com prova ativa em QA.
- `scripts/qa/qa-api-runner.mjs` endurecido para falhar de forma honesta no Windows sandbox em vez de fabricar falso negativo por `npm.cmd` ou `next build`.
- `docs/NEXT_SESSION_TRIGGER.md` e `docs/EXECUTION_TRACKING.md` consolidados como memoria macro do ciclo anterior.
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md` agora tambem concentra um plano executavel para os pontos identificados, separando bloqueio externo, dominios parciais e itens que ainda nao podem ser prometidos como prontos.
- `docs/DOCS_CLASSIFICATION.md` define a autoridade entre documentos; `docs/README_DOCS_HIERARCHY.md` organiza a ordem de leitura; `docs/EXECUTION_CONSOLIDATED_MASTER.md` ficou como crosswalk de apoio, sem disputar precedencia.
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`, `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md` e `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` alinhados ao runtime parcial real da Fase 2.
- `npm run check` revalidado em `2026-06-20` com `PASS`.
- Plano serial de execucao consolidado sem criar documento novo.
- `/community/campaigns/[id]` passou a traduzir readiness em proximo passo e expor acoes coerentes por papel e estado, reutilizando `submit`, `approve`, `pause` e `close`.
- `/affiliate/links` e `ReferralLink` agora sustentam pausa e reativacao reais, sem inventar reward, payout ou ledger novo.
- `qa:affiliate:referral` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando pausa, fallback publico sem atribuicao, reativacao, clique persistido e conversao idempotente.
- `qa:role:closure` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando tambem a integracao `artist + community + affiliate` no fechamento da trilha.
- `qa:community-curation` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando ownership, autenticacao, escopo autoral e transicao `submitted -> under_review -> approved`.
- `qa:catalog:curation` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando `artwork aprovado -> CatalogItem pending_review -> impact review -> ready -> published -> vitrine publica`.
- `app/artista/[slug]/page.tsx` deixou de prometer portfolio completo por artista e passou a enquadrar a rota como contexto editorial honesto do catalogo publicado.
- `app/category/[slug]/page.tsx` deixou de simular portfolio individual, filtro falso e load more cenografico; a pagina agora assume o recorte real do catalogo publicado.
- `app/help-center/page.tsx` trocou dois cards cenograficos por links reais para `policies` e `account/orders`.
- `app/quem-somos/page.tsx` deixou de expor copy publica corrompida e passou a declarar o estagio real do produto sem mojibake.
- `npm run utf8:check` revalidado em `2026-06-20` com `PASS`.
- smoke local em `next dev` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos` revalidado em `2026-06-20` com `PASS`.
- `app/journal/page.tsx` deixou de apontar para detalhe editorial inexistente.
- `app/register/page.tsx` trocou pseudo-links de termos/politicas por link real para `/policies`.
- `components/navigation/Footer.tsx` deixou de tratar icones sem destino como CTA.
- `docs/EXECUTION_TRACKING.md` voltou ao contrato de snapshot curto e deixou de quebrar `qa:blindspots`.
- `npm run check` revalidado em `2026-06-21` com `PASS`.
- `npm run qa:base:roles` revalidado em `2026-06-21` com `PASS`, incluindo `qa:routes`, `qa:blindspots`, `build`, `utf8:check`, `qa:product:guardrails` e malha autenticada por papel.
- smoke local em `next start` para `/`, `/journal` e `/register` revalidado em `2026-06-21` com `PASS`, com `/journal` sem detalhe morto.

## Ultimo passo executado
FRONT_3_CATALOG_CURATION_HARDENING foi aberta como frente ativa por autorizacao humana explicita, preservando FRONT_1_COMMUNITY_CAMPAIGNS como PARCIAL/PAUSADA e sem iniciar implementacao, gates ou T1.

## Bloqueio atual
`FRONT_5_REAL_PAYMENTS_CUTOVER` permanece bloqueada por dependencia externa e nao e a frente ativa. FRONT_3 nao autoriza financeiro, checkout, pagamento, webhook, producao/envio, referral ou attribution.

O risco real agora e:
- promover campanhas de `PARCIAL` para dominio maduro sem evidencia nova;
- abrir `Organization`, membership, reward financeiro proprio ou rotas paralelas por fora do recorte;
- reabrir W1-W8 como se fossem frentes atuais;
- promover pagamento real para `IMPLEMENTADO` sem evidencia operacional externa;
- tratar readiness local como homolog final fora de `localhost`.

## Evidencia
- `npm run p3:precheck`: `BLOCKED_EXTERNAL_BASE_URL` em `2026-06-21` quando `HML_BASE_URL=http://localhost:3000`
- `npm run p3:plug`: `BLOCKED_EXTERNAL_BASE_URL` em `2026-06-21`
- `npm run go:preflight`: `BLOCKED_EXTERNAL_BASE_URL` em `2026-06-21`
- `npm run go:e2e:proof`: `BLOCKED_EXTERNAL_BASE_URL` em `2026-06-21`
- `npm run check`: `PASS` em `2026-06-21`
- `npm run qa:base:roles`: `PASS` em `2026-06-21`
- `npm run build`: `PASS` em `2026-06-21` via `qa:base:roles`
- `npm run utf8:check`: `PASS` em `2026-06-21` via `qa:base:roles`
- `npm run utf8:check`: `PASS` em `2026-06-20`
- `qa:affiliate:referral` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- `qa:role:closure` com `QA_SERVER_MODE=dev`, `PAYOUT_SECURITY_WINDOW_DAYS=0` e `AUTH_SESSION_SECRET=qa-local-session-secret`: `PASS` em `2026-06-20`
- `qa:community-curation` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- `qa:catalog:curation` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- smoke local em `next dev`: `PASS` em `2026-06-20` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos`
- smoke local em `next start`: `PASS` em `2026-06-21` para `/`, `/journal` e `/register`
- `docs/NEXT_SESSION_TRIGGER.md`: ciclo anterior fechado com regra clara de retomada
- `artifacts/audits/2026-07-19-w7-backfill-classification.md`: W7 classificada diferencialmente sem reabrir W1-W6
- `artifacts/audits/2026-07-19-w8-external-promotion-preflight.md`: W8 preparada para evidencia externa, sem afirmar homologacao PASS
- `docs/EXECUTION_TRACKING.md`: snapshot ativo revalidado com o saneamento documental do ciclo
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`: `CampaignProduct` e snapshot contextualizado agora aparecem como `PARCIAL` tambem no status documental
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` e `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`: handoffs atualizados para nao bloquear leitura do runtime parcial real
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`: sequencia macro passa a refletir execucao serial das frentes abertas
- `app/journal/page.tsx`: home editorial sem rota detalhada inexistente
- `app/register/page.tsx`: termos/politicas com destino real em `/policies`
- `components/navigation/Footer.tsx`: icones neutros, sem CTA falso
- `scripts/release/p3-plug-and-run.mjs`, `scripts/release/go-live-preflight.mjs` e `scripts/release/go-live-e2e-proof.mjs`: dry-run agora denuncia bloqueio externo real quando a base URL ainda e local
- `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`, `docs/GO_LIVE_E2E_PROOF_RUNBOOK.md` e `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`: runbooks alinhados para separar baseline local aprovada de janela externa real ainda bloqueada
- `docs/P3_ENV_READY_TO_FILL.md` e `docs/RUNBOOK_GO_LIVE.md`: atalhos operacionais agora deixam explicito que `BLOCKED_EXTERNAL_BASE_URL` em localhost e o comportamento correto antes da janela real
- `docs/P3_HOMOLOG_CUTOVER_EVIDENCE_TEMPLATE.md` e `docs/CHECKLIST_RELEASE_PAGAMENTOS.md`: templates auxiliares agora exigem `PASS` fora de localhost e tratam bloqueio local como leitura honesta do gate
- `app/community/campaigns/[id]/page.tsx`: detalhe de campanha agora mostra proximo passo coerente e acoes acionaveis por role/estado
- `app/api/affiliate/links/[id]/pause/route.ts` e `app/api/affiliate/links/[id]/activate/route.ts`: transicoes operacionais reais de `ReferralLink`
- `app/affiliate/links/page.tsx`: workspace do afiliado agora explicita e controla status ativo/pausado
- `scripts/qa/qa-affiliate-referral.mjs`: suite preparada e aprovada para o recorte novo
- `e0df063`: `ACTIVE_FRONT` passou a vencer o espelho operacional para frente, objetivo e branch; `npm run test:agent-route` passou 6/6 em 2026-07-25.

## Proximo passo exato
Ler as fontes autoritativas de catalogo e curadoria e desenhar o primeiro recorte tecnico da FRONT_3, sem implementar diretamente nem executar gate funcional. FRONT_1 permanece PARCIAL/PAUSADA; qa:community:revenue PASS vigente apenas para community_campaign_revenue_read_ownership_only e nao valida order, checkout, payment, webhook, production, shipping, referral ou attribution. FRONT_3 nao autoriza financeiro, checkout, pagamento, webhook, producao/envio, referral ou attribution.

## Nao reabrir sem evidencia nova
- `lib/access-control.ts` como autoridade canonica de permissao
- namespaces canonicos por papel como unica referencia interna
- `qa:base:roles` como gate obrigatorio para rota, RBAC, jornada e superficie cross-role
- campanha publica, referral e leitura por campanha como provas fechadas do recorte atual
- `spawn EPERM/EINVAL` em sandbox Windows como ruido ambiental quando a malha serial ja passou fora do sandbox

## Regra de encerramento da sessao
Nenhuma sessao encerra sem atualizar:
- `docs/ACTIVE_FRONT.md`
- `docs/NEXT_SESSION_TRIGGER.md` se a regra de retomada mudar
- `.agents/session-state.json`
