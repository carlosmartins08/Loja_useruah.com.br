# Next Session Trigger

Data de revisao: 2026-08-03

## Objetivo
FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa. Objetivo: readiness interno para payment.approved com fronteira transacional segura. FRONT_ORDER_CHECKOUT_PAYMENT_READINESS permanece pausada como PARCIAL fortalecida, não DONE.

## Gatilho canonico de retomada
Toda nova sessao deve comecar por este gatilho, nesta ordem:
1. Ler `docs/ACTIVE_FRONT.md`.
2. Ler `docs/NEXT_SESSION_TRIGGER.md`.
3. Ler `docs/EXECUTION_TRACKING.md`.
4. Ler `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`.
5. Confirmar verbalmente ou internamente:
   - onde o trabalho parou;
   - o que ja foi provado;
   - qual e a frente unica ativa;
   - qual e o proximo passo exato;
   - qual e a condicao de pivot para evitar loop;
   - se W7 e W8 estao sendo tratados como historico com metadados suficientes, sem inventar detalhes.
6. So depois executar.

## Prompt curto para colar amanha
`Confirme FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS como frente única ativa e preserve PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION como primeira evidência vigente: fc05f9d, qa:payment:approved:decoupling PASS, QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS e PAY-APP-01 a PAY-APP-10. Reavalie o próximo recorte sem implementar consumidor de outbox, executar novo gate funcional, promover cutover ou tocar efeitos downstream sem autorização humana explícita. T1 permanece não iniciado.`

### Prompt anterior, concluído pelo recorte comprovado
Use este prompt literalmente ou com ajuste minimo:

`Confirme FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS como frente unica ativa. Execute somente o inventario tecnico e contratual de payment.approved, webhook inbox, transacao de aprovacao e outbox duravel, sem alterar codigo e sem executar gate funcional. Preserve FRONT_ORDER_CHECKOUT_PAYMENT_READINESS como PARCIAL fortalecida, nao DONE, e preserve cbdfc91/f1645a2, 349b21f/92778d6 e 90519b0/0b027bc. Nao toque provider real, HML, cutover, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout.`

## Checklist anti-retrabalho
Antes de qualquer patch, a retomada precisa responder `SIM` para tudo abaixo:
- estou partindo da frente ativa registrada, e nao de memoria parcial;
- nao vou reabrir frente ja provada sem evidencia nova;
- nao vou criar documento paralelo para decidir o que os documentos ativos ja decidem;
- nao vou insistir no mesmo runner se ele repetir o mesmo bloqueio sem aprendizado novo;
- consigo dizer em uma linha qual e o proximo passo exato desta sessao.

Se qualquer item acima for `NAO`, parar e corrigir a leitura antes de implementar.

## Protocolo de continuidade operacional
- `docs/ACTIVE_FRONT.md` passa a ser a memoria operacional canonica da frente em aberto.
- `.agents/session-state.json` espelha o mesmo estado em formato legivel por maquina.
- `docs/EXECUTION_TRACKING.md` continua como snapshot macro e ponte para historico.
- Se a sessao encerrar com bloqueio, registrar o bloqueio em `docs/ACTIVE_FRONT.md` e `.agents/session-state.json` antes de parar.

## Regra de retomada obrigatoria
1. Ler antes de agir:
   - `docs/ACTIVE_FRONT.md`
   - `docs/NEXT_SESSION_TRIGGER.md`
   - `docs/EXECUTION_TRACKING.md`
   - `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
   - `.agents/session-state.json`
   - `docs/ROUTES.md`
   - `docs/JOURNEY_MATRIX_BY_ROLE.md`
   - `docs/CODEBASE_MAP.md`
2. Tratar como ja fechado:
   - RBAC tipado consolidado
   - namespaces canonicos por papel
   - dashboards sem links para rota bloqueada
   - `impact-reviews` com leitura cross-role e decisao restrita
   - gate serial `qa:base:roles`
3. Nao aceitar atalho:
   - nao usar header fallback para validar fluxo sensivel se o runtime exigir sessao real
   - nao criar rota nova para contornar guard existente
   - nao reexportar pagina de outro papel para fingir jornada propria
   - nao insistir no mesmo runner local quando ele repetir o mesmo bloqueio sem aprendizado novo; registrar o limite em `docs/ACTIVE_FRONT.md` e pivotar para a proxima frente serial resolvivel
4. Sempre provar antes de encerrar:
   - `npm run check`
   - `npm run build` quando houver impacto estrutural
   - `npm run qa:base:roles` para mudanca em rota, RBAC, jornada ou superficie cross-role

## Estado consolidado no fim deste ciclo
- Base estrutural atual: `ESTAVEL NO RECORTE`
- `check`: `PASS`
- `build`: `PASS`
- `qa:role:journeys`: `PASS`
- `qa:base:roles`: `PASS`
- `qa:campaign:impact`: `PASS`
- `qa:campaign:detail`: `PASS` em MySQL QA isolado; a evidencia vigente esta registrada abaixo e nao promove maturidade.
- `qa:community:revenue`: `PASS` vigente apenas para `community_campaign_revenue_read_ownership_only`. Não valida order, checkout, payment, webhook, production, shipping, referral ou attribution.
- `qa:campaign:public`: `PASS` em MySQL QA isolado; a evidencia vigente esta registrada abaixo e nao promove maturidade.
- `p3:precheck`: `BLOCKED_EXTERNAL_BASE_URL` quando `HML_BASE_URL=http://localhost:3000`
- `p3:plug`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local
- `go:preflight`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local
- `go:e2e:proof`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local

## Evidencia adicional deste ciclo
- PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION registrada como primeira evidência técnica da FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS. Commit técnico: fc05f9d fix(payments): decouple approved payment effects with outbox. Resultado funcional: qa:payment:approved:decoupling PASS. Classificação: QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS. PAY-APP-01 a PAY-APP-10 passaram. Payment processing → approved e Order placed → paid ocorrem em transação MySQL única. Inbox, payment event, outbox PaymentApproved e marcação de inbox processado são commitados juntos. Falha injetada antes do commit não deixou estado parcial. Retry sequencial e concorrente não duplicaram payment event nem outbox. ProductionJob, shipment, splits, licenças, comissões, referral, payout, Dimona e provider real tiveram delta zero. Migration 004 cria somente outbox PaymentApproved durável e não altera domínios downstream. Nenhum consumidor de outbox foi implementado. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta evidência não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. O build do runner executou `qa:product:guardrails` como pré-condição estática; o único gate funcional executado diretamente foi `qa:payment:approved:decoupling`. Esta evidência não declara MVP pronto. T1 permanece não iniciado.
- ORDER_CHECKOUT_STATUS_COPY_HONESTY_REPAIR registrada como terceira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 90519b0 fix(checkout): make processing status copy honest. Resultado: qa:order:status:honesty PASS. Classificação: QA_ORDER_CHECKOUT_STATUS_COPY_HONESTY_PASS. ORD-STATUS-01 a ORD-STATUS-04 passaram. Esta evidência corrige a apresentação visual para não tratar payment processing como approved e pedido placed como paid ou concluído. CheckoutSuccessCard não afirma produção iniciada para payment processing. /success não vende pagamento aprovado sem estado real. account/orders passa a exibir paymentStatus separadamente. Esta evidência é guardrail estático, não prova browser/runtime. Payment permanece processing e pedido permanece placed. Esta evidência é readiness interno, não cutover externo. Não valida pagamento homologado com provedor real, webhook approved, HML externa, Base URL pública, inscrição real de webhook, transação real de provedor, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout e não declara MVP pronto. Nenhuma migration foi criada. T1 permanece não iniciado.
- ORDER_CREATION_IDEMPOTENCY_REPAIR registrada como segunda evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 349b21f fix(orders): make checkout order creation idempotent. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-12 passaram. A correção impede que retry completo do checkout crie pedido órfão. Mesma tentativa autenticada com mesmo payload retorna o mesmo orderId. Mesma tentativa com payload incompatível retorna 409 order_idempotency_conflict. Outro customer possui namespace próprio; checkout continua idempotente no mesmo pedido e associação cruzada de payment continua bloqueada. Payment permanece processing e pedido permanece placed, nunca paid. A migration `infra/mysql/migrations/003_order_creation_idempotency.sql` mapeia `customerId + idempotencyKey/tentativa -> orderId + payloadHash`, com chave única composta e FK para `orders`, garantindo durabilidade e concorrência sem alterar payment, webhook, produção/envio, referral, payout ou RBAC. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida webhook approved. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook, transação real de provedor, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout e não declara MVP pronto. Copy/status visual de /success e CheckoutSuccessCard permanecem lacuna futura. O build do runner executa `qa:product:guardrails` como pré-condição estática; nenhum gate funcional amplo foi executado diretamente. Nenhuma rota proibida foi chamada; webhook approved não foi chamado e produção/envio, referral, attribution, comissões, payout, Dimona e provider real não foram tocados. T1 permanece não iniciado.
- QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION registrada como primeira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: cbdfc91 fix(payments): scope checkout idempotency by order. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-10 passaram. A correção impede reutilização cruzada de x-idempotency-key entre pedidos diferentes. Mesma x-idempotency-key para o mesmo pedido retorna o mesmo payment. Mesma x-idempotency-key para outro pedido retorna 409 idempotency_key_order_conflict. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real, webhook approved, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Nenhuma migration foi criada. Durante runner/build, qa:product:guardrails pode ser executado como pré-condição estática; nenhum gate funcional amplo foi executado diretamente. Nenhum webhook approved foi chamado. T1 permanece não iniciado.
- `qa:routes`: `PASS`
- `qa:blindspots`: `PASS`
- `qa:campaign:impact`: `PASS`
- `qa:community-curation`: `PASS`
- `qa:catalog:curation`: `PASS`
- `qa:catalog:lifecycle`: `PASS` vigente para `QA_CATALOG_LIFECYCLE_REVERSAL_ISOLATION`
- `qa:affiliate:referral`: `PASS`
- `ops:campaign:public`: `PASS`
- `qa:role:closure`: `PASS`
- `qa:coreops`: `PASS`
- `qa:crossrole:impact`: `PASS`
- `qa:matrix:audit`: `PASS`
- `qa:affiliate:referral` em `QA_SERVER_MODE=dev`: `PASS`
- `qa:role:closure` em `QA_SERVER_MODE=dev`: `PASS` quando a execucao respeita `PAYOUT_SECURITY_WINDOW_DAYS=0` e `AUTH_SESSION_SECRET=qa-local-session-secret`
- `utf8:check`: `PASS`
- smoke local em `next dev` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos`: `PASS`
- smoke local em `next start` para `/`, `/journal` e `/register`: `PASS`

## Regra anti-loop
- Se a mesma prova local falhar ou for interrompida duas vezes sem produzir evidencia nova, isso deixa de ser tarefa ativa e vira limitacao de ambiente.
- A sessao deve registrar esse limite em `docs/ACTIVE_FRONT.md` e `.agents/session-state.json`, depois seguir para outra frente serial valida.

## Contrato minimo da proxima sessao
A próxima sessão está autorizada somente a reavaliar documental e tecnicamente a frente após `PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION` e recomendar o próximo recorte. Não implementar consumidor de outbox, executar novo gate funcional, promover cutover externo ou tocar efeitos downstream sem autorização humana explícita.

A proxima sessao so esta autorizada a:
1. reavaliar documental e tecnicamente a frente após a evidência `PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION`; e
2. recomendar o próximo recorte sem implementar consumidor de outbox, executar novo gate funcional, promover cutover externo ou tocar efeitos downstream sem autorização humana explícita.

Qualquer outra abertura de escopo conta como desvio e deve ser recusada antes do primeiro patch.

## Verdades que nao devem ser reabertas sem evidencia nova
- `lib/access-control.ts` e a autoridade canonica de permissao de runtime.
- `lib/role-routing/access-routing.ts` decide superficie e redirect, nao regra de negocio.
- `/admin/impact-reviews` continua superficie cross-role de governanca.
- Leitura cross-role nao implica poder de aprovar ou rejeitar.
- Redirect legado e compatibilidade externa, nao superficie interna viva.
- Falha em runner paralelo nao vale como regressao se a malha serial passar.
- `spawn EPERM` em `next build` dentro de sandbox Windows nao vale como regressao se `build` e `qa:base:roles` passarem fora do sandbox no mesmo working tree.
- Em Windows sandboxado, uma rota nova pode exigir `QA_SERVER_MODE=dev` para QA especifica quando `start` estiver reusando build antigo sem o patch atual.
- Divergencia entre execucao manual e gate oficial so vale como sinal tecnico quando as mesmas envs do gate estiverem presentes.
- `/community/campaigns/[id]` e `GET /api/campaigns/[id]` agora sao a memoria operacional canonica da campanha, inclusive para leitura por governanca.
- `/api/commissions/me/campaigns` e a secao nova de `/community/revenue` mostram atribuicao real por campanha, nao payout isolado por campanha.
- Curadoria de `artwork` nao pula mais de `submitted` direto para decisao final; a etapa `under_review` passou a ser contrato real do runtime.
- A cadeia `artwork aprovado -> CatalogItem pending_review -> impact review -> ready -> published` passou a ter prova ativa; nao voltar a tratar bootstrap seed como unica evidencia valida do dominio.
- `artist`, `community_manager` e `affiliate` deixaram de ser papeis parcialmente cenograficos: agora fecham atribuicao real ate pedido, ledger ou conversao conforme seu escopo.
- Afiliacao deixou de ser tela estatica: `/affiliate`, `/affiliate/links`, `/api/affiliate/links`, `/af/[slug]` e o snapshot de pedido agora sustentam link, clique e conversao reais, mas sem ledger de rewards.
- O snapshot contextualizado da Fase 2 deixou de congelar so ids e metadados soltos: quando a compra nasce de campanha ativa, ele ja preserva `campaignName`, a regra vigente e a composicao formal de preco com `movementMarkup` + `priceCompositionVersion`.
- `CampaignProduct` deixou de ser capacidade imaginada: `/api/campaigns/[id]/products`, `/community/campaigns`, `/c/[campaignId]` e o checkout agora respeitam vinculo real entre campanha ativa e `CatalogItem` publicado.
- Rejeicao de `impact review` em `Campaign` nao deixa mais campanha travada em `pending_review`: o runtime devolve para `rejected`, preserva `decisionReason` em `/api/campaigns` e `/community/campaigns` passou a mostrar essa devolutiva ao owner.
- `/admin/impact-reviews` passou a sustentar um recorte proprio de campanhas com historico e contexto de runtime; `platform_admin` aprova/rejeita a `impact review` ali e `curator/platform_admin` conseguem concluir a moderacao final da campanha sem abrir dominio novo de `Organization`.
- `/` e `/category/[slug]` deixaram de se apoiar em cards estaticos para vender: agora refletem o catalogo publicado real que alimenta `/shop`.
- Home, help center, login, cadastro publico, footer, menu mobile, CTA de produto, `/returns`, `/policies` e `/quem-somos` deixaram de prometer personalizacao self-service, portal autonomo de troca, login social inexistente, canais externos ou contatos oficiais que o runtime nao sustenta hoje.
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` deixou de tratar `/@username*` e `/affiliate/rewards` como mapa pratico de continuidade; essas superficies seguem planejadas e nao podem ser presumidas no runtime atual.

## Proxima frente permitida
FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS e a frente unica ativa. Sua primeira evidência interna está registrada por `fc05f9d` e `QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS`; isso não autoriza consumidor de outbox, efeitos downstream, homologação externa ou cutover. FRONT_ORDER_CHECKOUT_PAYMENT_READINESS, FRONT_QA_GATE_GOVERNANCE_CLEANUP e FRONT_3_CATALOG_CURATION_HARDENING permanecem pausadas como PARCIAL fortalecida; Artwork e CatalogItem permanecem PARCIAL; T1 permanece nao iniciado.

Leitura operacional deste momento:
- Abertura autorizada: FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa. Objetivo: readiness interno para payment.approved com fronteira transacional segura. Esta frente nao e cutover externo e nao valida pagamento homologado, provider real, HML externa, Base URL publica, inscricao real de webhook, transacao real, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. Primeiro passo: inventario tecnico e contratual sem alteracao de codigo.
- `affiliate-referral` fechou o recorte novo.
- `catalogo-curadoria/artwork` fechou o recorte validado nesta sessao.
- `superficies publicas` fechou o recorte ativo com saneamento de `artista`, `category`, `help-center`, `quem-somos`, `journal`, `register` e `footer`.
- W1-W8 sao historico processado para fins de continuidade; W7/W8 nao autorizam afirmar homologacao externa.
- `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT` foi concluida: documentos, espelho operacional e roteador concordam, e caches locais nao participam da autoridade.
- FRONT_QA_GATE_GOVERNANCE_CLEANUP esta pausada como PARCIAL fortalecida e nao esta DONE.
- FRONT_3_CATALOG_CURATION_HARDENING permanece pausada como PARCIAL fortalecida; FRONT_3 nao esta DONE e Artwork e CatalogItem permanecem PARCIAL.
- Pausa autorizada: FRONT_ORDER_CHECKOUT_PAYMENT_READINESS esta PARCIAL fortalecida, nao DONE. A frente provou readiness interno ate pedido placed e payment processing. Nao validou payment.approved, webhook approved, pagamento homologado, cutover externo, HML externa, Base URL publica, inscricao real de webhook, transacao real de provedor, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. payment.approved cruza producao e financeiro e exige nova frente/autorizacao explicita. As evidencias preservadas sao cbdfc91/f1645a2, 349b21f/92778d6 e 90519b0/0b027bc. qa:order:status:honesty e estatico e nao substitui prova browser/runtime. Bloqueio registrado: BLOCKED_BY_PAYMENT_APPROVED_CROSSES_PRODUCTION_FINANCE_DOMAINS. Nenhum dominio foi promovido a DONE, nenhum novo front foi aberto e T1 permanece nao iniciado.
- QA_GATE_ALIAS_QUARANTINE registrada como primeira acao tecnica da FRONT_QA_GATE_GOVERNANCE_CLEANUP. Commit tecnico: 8b4ee58 chore(qa): quarantine legacy QA aliases. qa:catalog e qa:full foram colocados em quarentena/fail-fast explicito para evitar falso PASS e falsa cobertura. qa:catalog:curation, qa:catalog:authority e qa:catalog:lifecycle permanecem como gates vigentes de catalogo com evidencia propria. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- QA_ROLE_CLOSURE_ALIAS_QUARANTINE registrada como segunda acao tecnica da FRONT_QA_GATE_GOVERNANCE_CLEANUP. Commit tecnico: 9ae24f3 chore(qa): quarantine role closure alias. qa:role:closure foi colocado em quarentena/fail-fast explicito para evitar falso PASS e falsa cobertura de fechamento por papeis. qa:role:closure nao e evidencia funcional vigente. Eventual retomada de role closure exige recorte isolado e autorizacao humana explicita. qa:base:roles e pr:premerge permanecem inalterados nesta acao. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- QA_BASE_ROLES_ALIAS_QUARANTINE registrada como terceira acao tecnica da FRONT_QA_GATE_GOVERNANCE_CLEANUP. Commit tecnico: 4390f1a chore(qa): quarantine base roles alias. qa:base:roles foi colocado em quarentena/fail-fast explicito para evitar falso PASS e falsa cobertura de maturidade por papeis. qa:base:roles nao e evidencia funcional vigente. Eventual retomada de base roles exige decomposicao em recortes isolados e autorizacao humana explicita. pr:premerge permanece inalterado nesta acao. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- Pausa autorizada: a frente neutralizou qa:catalog, qa:full, qa:role:closure e qa:base:roles como aliases de risco para falso PASS e falsa cobertura. pr:premerge permanece governanca estatica de PR, nao evidencia funcional vigente. qa:catalog:persisted permanece historico/referencial, nao evidencia vigente de autoridade de catalogo. Os gates vigentes separados sao qa:catalog:curation, qa:catalog:authority e qa:catalog:lifecycle. Esta pausa nao valida maturidade completa do sistema nem pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout ou Dimona. Proximo avanco bloqueado por BLOCKED_BY_MISSING_NEXT_FRONT_AUTHORITY; T1 permanece nao iniciado.
- Por autorizacao humana explicita, FRONT_ORDER_CHECKOUT_PAYMENT_READINESS aberta como frente ativa. Objetivo: readiness interno de pedido, checkout, webhook assinado e status, com MySQL QA isolado e sessao real. Esta frente nao e cutover externo e nao valida pagamento homologado com provedor real. Producao/envio, Dimona, affiliate, referral, attribution, comissoes e payout permanecem fora. Primeiro passo: inventario tecnico e documental sem alteracao de codigo.
- `real-payments-cutover` permanece dependencia externa bloqueada e nao deve ser reaberta como frente atual.
- `npm run qa:campaign:authority` passou em MySQL QA local isolado, com schema `001`/`002`, provando persistencia de `Campaign` e `CampaignProduct` apos reinicio sem fallback dos dados locais obsoletos; os caches locais de campanha foram restaurados ao fim do gate.
- Em 2026-07-28, `npm run qa:campaign:impact` passou em `useruah_qa_campaign_impact` no host `localhost`, usando somente `QA_DATABASE_URL`, distinta de `DATABASE_URL`, com schemas `001_payments.sql` e `002_distribution_authority.sql`. A base principal `useruah` foi preservada: a campanha criada existe uma vez na QA e zero vezes nela. O gate provou criacao, submissao, bloqueio por revisao pendente, aprovacao da revisao, ativacao, pausa e reativacao; chamou somente endpoints de campanhas e revisoes de impacto. `.tmp-store/active-agent-plan.json` permaneceu ausente. Nao houve pedido, checkout, pagamento, webhook, falha funcional reproduzivel, `CAMPAIGN_*_REPAIR` ou inicio de T1. `Campaign` e `CampaignProduct` seguem `PARCIAL`.
- Em 2026-07-28, `npm run qa:campaign:detail` passou em MySQL QA local isolado em `useruah_qa_campaign_detail`, usando somente `QA_DATABASE_URL`, distinta de `DATABASE_URL`. O gate semeou identidades QA, autenticou `community_manager`, `curator`, `platform_admin` e um segundo `community_manager` por `/api/auth/login` com cookie real `ruah_session`, fez bootstrap de catalogo, criacao de campanha, vinculo `CampaignProduct`, submissao, revisao de impacto e leituras autenticadas. O segundo `community_manager`, sem ownership, recebeu `403`; header fallback nao foi usado como autorizacao funcional. Nao houve pedido, checkout, pagamento ou webhook; `.tmp-store/active-agent-plan.json` permaneceu ausente, `.next` compartilhado foi preservado, `next-env.d.ts` e `tsconfig.json` foram restaurados e `qa-next-campaign-detail` foi removido. A evidencia nao autoriza `CAMPAIGN_MODEL_REPAIR`, `CAMPAIGN_PRODUCT_LINK_REPAIR` ou `CAMPAIGN_ROUTING_REPAIR`, nao inicia T1 e mantem `Campaign` e `CampaignProduct` como `PARCIAL`.
- Em 2026-07-29, `npm run qa:campaign:public` passou em MySQL QA local isolado em `useruah_qa_campaign_detail`, usada temporariamente porque a base preferida `useruah_qa_campaign_public` nao estava acessivel pela credencial local. A base e QA, local e distinta da principal `useruah`. O gate semeou identidades QA, usou login real por `/api/auth/login` e cookie `ruah_session` para `curator`, `community_manager` e `platform_admin`, mantendo visitante anonimo. Provou setup e governanca de campanha, superficie publica `/api/campaigns/[id]/public` e `/c/[id]`, vitrine contextual `/c/[id]/shop` e `/shop`, PDP contextual `/product/[id]` e estados inexistente, inativo e sem produtos. Header fallback nao foi autorizacao funcional; nao houve chamadas a pedido, checkout, pagamento, webhook, afiliado, termos ou `/af/`. `.tmp-store/active-agent-plan.json` permaneceu ausente, `.next` compartilhado foi preservado, `next-env.d.ts` e `tsconfig.json` foram restaurados, `qa-next-campaign-public` foi removido e a porta 3340 fechou. A evidencia nao autoriza `CAMPAIGN_PUBLIC_SURFACE_REPAIR`, `CAMPAIGN_PUBLIC_SHOP_CONTEXT_REPAIR`, `CAMPAIGN_PUBLIC_PDP_CONTEXT_REPAIR` ou reparo de dominio, nao inicia T1 e mantem `Campaign` e `CampaignProduct` como `PARCIAL`.
- Em 2026-07-29, o commit `44bca23` registrou o fixture que permitiu `npm run qa:community:revenue` passar em `useruah_qa_community_revenue`. qa:community:revenue PASS vigente apenas para community_campaign_revenue_read_ownership_only. O fixture controlado foi lido pelo owner no breakdown por campanha, o agregado permaneceu coerente, outro `community_manager` nao leu a receita e papel nao financeiro recebeu bloqueio. Não valida order, checkout, payment, webhook, production, shipping, referral ou attribution. Campaign/CampaignProduct permanecem PARCIAL, agora com evidência adicional de leitura/ownership de receita por campanha. Esta prova nao autoriza maturidade financeira, payout real, reparo de dominio ou inicio de T1.
- FRONT_1_COMMUNITY_CAMPAIGNS encerrada/pausada como PARCIAL conscientemente limitado por BLOCKED_BY_MISSING_AUTHORIZED_NEXT_GATE. Campaign/CampaignProduct permanecem PARCIAL. Não há autorização para avançar para financeiro completo, qa:base:roles, payout, checkout, payment ou nova frente sem decisão explícita posterior.
- Por autorizacao humana explicita, FRONT_3_CATALOG_CURATION_HARDENING foi aberta como nova frente ativa. FRONT_3 nao autoriza financeiro, checkout, pagamento, webhook, producao/envio, referral ou attribution; T1 nao foi iniciado.
- Commit `4cbb75e` registrou `qa:catalog:curation PASS vigente para QA_CATALOG_CURATION_ISOLATION.` Evidence covers authenticated QA curation/catalog chain: artwork submission, review, approval, catalog governance blocks, impact review, ready, publish and public reads. CAT-CUR-01 a CAT-CUR-14 passaram em MySQL QA isolado `useruah_qa_catalog_curation`, com `ruah_session`, sem `x-actor-*`, sem `ALLOW_HEADER_ACTOR_FALLBACK` e com artefato Next isolado. Artwork e CatalogItem permanecem PARCIAL. FRONT_3_CATALOG_CURATION_HARDENING permanece ativa; nao esta DONE. Nao valida pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout ou Dimona. Nao altera produto, dominio, RBAC ou migrations.
- Commit `9d00b01` registrou `qa:catalog:authority PASS vigente para QA_CATALOG_AUTHORITY_RESTART_ISOLATION.` QA_RUNNER_CONTROLLED_RESTART_CAPABILITY validada de forma opt-in pelo commit 9d00b01. Evidence covers MySQL QA catalog authority across controlled Next restart and stale local cache not overriding MySQL. CAT-AUTH-01 a CAT-AUTH-04 cobriram autenticacao do curator por `ruah_session`, bootstrap e leitura publica em MySQL QA antes do restart, restart controlado do Next sobre o mesmo build isolado e persistencia do catalogo apos restart sem prevalencia do cache local obsoleto. Artwork e CatalogItem permanecem PARCIAL. FRONT_3_CATALOG_CURATION_HARDENING permanece ativa; não está DONE. Não valida pedido, checkout, pagamento, webhook, produção/envio, affiliate, referral, attribution, payout ou Dimona. Não altera produto, domínio, RBAC ou migrations.
- Commit `3dc9134` registrou `qa:catalog:lifecycle PASS vigente para QA_CATALOG_LIFECYCLE_REVERSAL_ISOLATION.` Evidence covers authenticated catalog lifecycle reversal: published visibility, archive/unpublish public removal, reopen to draft without public visibility, ready without public overexposure, and publish restoring public visibility. CAT-LIFE-01 a CAT-LIFE-10 passaram em MySQL QA isolado `useruah_qa_catalog_lifecycle`, com `ruah_session`, sem `x-actor-*`, sem `ALLOW_HEADER_ACTOR_FALLBACK` e com `QA_NEXT_DIST_DIR=.tmp-store/qa-next-catalog-lifecycle`; curator autenticado, artist e anonimo bloqueados (403 pelo contrato atual), allowlist e blocklist permaneceram ativas.
- As evidencias vigentes cobrem cadeia positiva de curadoria/catalogo (`4cbb75e` tecnico, `b213fba` documental), autoridade MySQL apos restart controlado (`9d00b01` tecnico, `a4afcb7` documental) e reversao publica do lifecycle (`3dc9134` tecnico, `60580ea` documental). As evidencias nao validam rejeicao auditavel de Artwork, auditoria duravel, midia, SEO, staging, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout ou Dimona. Proximo avanco bloqueado por BLOCKED_BY_MISSING_NEXT_FRONT_AUTHORITY.

## Sinais de desvio
Se qualquer um destes aparecer, parar e corrigir a direcao:
- dashboard apontando para rota que o proprio papel nao abre
- componente compartilhado disparando fetch proibido para papel valido
- teste passando com header fake onde producao exige cookie real
- docs ativos ensinando alias legado como se fosse canonicidade
- mudanca de negocio sendo resolvida dentro de `context/**` ou `hooks/**`

## Pergunta de controle no inicio da proxima sessao
Antes de implementar, responder internamente:
`A mudanca proposta respeita a base canonica atual ou esta reintroduzindo ambiguidade de rota, permissao, jornada ou ownership?`

Se a resposta nao for claramente a primeira, nao avancar direto.
