# Active Front

Data de revisao: 2026-08-03
Branch: `main`
Responsavel atual: `Codex + usuario`
Status da frente: `FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS` — `ATIVA`

## Objetivo atual
FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa. Objetivo: readiness interno para payment.approved com fronteira transacional segura.

## Gatilho rapido de retomada
Se a sessao cair ou for retomada depois:
1. abrir `docs/NEXT_SESSION_TRIGGER.md` como ponto de entrada canonico;
2. confirmar `frente ativa`, `ultimo passo executado`, `evidencia` e `proximo passo exato`;
3. recusar qualquer desvio que pule essa leitura.

## Frente unica aberta
Frente atual selecionada:
- `FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS`

Estado operacional:
- FRONT_1_COMMUNITY_CAMPAIGNS permanece PARCIAL/PAUSADA, conscientemente limitada por BLOCKED_BY_MISSING_AUTHORIZED_NEXT_GATE, e nao esta DONE.
- Campaign/CampaignProduct permanecem PARCIAL.
- qa:community:revenue permanece limitado a community_campaign_revenue_read_ownership_only; nao valida order, checkout, payment, webhook, production, shipping, referral ou attribution.
- FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa por autorizacao humana explicita.
- FRONT_ORDER_CHECKOUT_PAYMENT_READINESS permanece pausada como PARCIAL fortalecida, não DONE.
- FRONT_QA_GATE_GOVERNANCE_CLEANUP permanece pausada como PARCIAL fortalecida.
- FRONT_3_CATALOG_CURATION_HARDENING permanece pausada como PARCIAL fortalecida.
- FRONT_3 nao esta DONE; Artwork e CatalogItem permanecem PARCIAL.
- T1 permanece nao iniciado.

Motivo:
- `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT` concluiu a reconciliacao entre `ACTIVE_FRONT`, `NEXT_SESSION_TRIGGER`, `.agents/session-state.json` e o roteador.
- W1-W8 permanecem historico processado; W7/W8 continuam limitados as evidencias existentes e nao afirmam homologacao externa.
- A autorizacao humana explicita abriu `FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS` para analisar e desacoplar a fronteira transacional interna de `payment.approved`, sem autorizar cutover externo ou prova funcional nesta rodada.
- `FRONT_5_REAL_PAYMENTS_CUTOVER` continua bloqueada por dependencia externa e nao e a frente ativa.

Limite preservado:
- Nesta rodada, esta frente não altera código, produto, domínio, RBAC, migrations, banco, scripts ou package.json.
- Esta frente não é cutover externo e não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor.
- Produção/envio, Dimona, affiliate, referral, attribution, comissões e payout permanecem fora.
- FRONT_3 preserva as evidencias de cadeia positiva de curadoria/catalogo, autoridade MySQL apos restart controlado e reversao publica do lifecycle; isso nao fecha auditoria duravel, midia, SEO ou staging.

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

7. `FRONT_ORDER_CHECKOUT_PAYMENT_READINESS`
Problema real: o fluxo minimo transacional precisa de evidencia interna isolada antes de qualquer homologacao externa ou cutover.
Usuarios/roles: `customer` e `platform_admin` apenas para setup QA controlado.
Fonte autoritativa: `docs/PAYMENTS_DEFINITION_OF_DONE.md`, `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` e `docs/EXECUTION_TRACKING.md`.
Primeiro passo: inventario tecnico e documental de pedido, checkout, pagamento, webhook e status, sem alteracao de codigo.
Nao tocar: producao/envio, Dimona, affiliate, referral, attribution, comissoes, payout, HML externa, credenciais reais ou cutover.

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
PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION registrada como primeira evidência técnica da FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS. Commit técnico: fc05f9d fix(payments): decouple approved payment effects with outbox. Resultado funcional: qa:payment:approved:decoupling PASS. Classificação: QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS. PAY-APP-01 a PAY-APP-10 passaram. O webhook approved assinado foi obrigatório no gate, e `QA_SCRIPT` não dispensou assinatura quando `QA_REQUIRE_WEBHOOK_SIGNATURE=true`. Payment processing → approved e Order placed → paid ocorrem em transação MySQL única. Inbox, payment event, outbox PaymentApproved e marcação de inbox processado são commitados juntos. O outbox PaymentApproved é durável e único. Falha injetada antes do commit não deixou estado parcial. Retry após a falha controlada concluiu corretamente. Retry sequencial e concorrente não duplicaram payment event nem outbox. `payment.pending` não rebaixou estado terminal. ProductionJob, shipment, splits, licenças, comissões, referral, payout, Dimona e provider real tiveram delta zero. Migration 004 cria somente outbox PaymentApproved durável e não altera domínios downstream. A migration `infra/mysql/migrations/004_payment_approved_outbox.sql` mantém status inicial `pending`, unicidade por `event_type + payment_id`, índice por `status + available_at` e FKs compatíveis. Nenhum consumidor de outbox foi implementado. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta evidência não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Esta evidência não declara MVP pronto. O build do runner executou `qa:product:guardrails` como pré-condição estática; o único gate funcional executado diretamente foi `qa:payment:approved:decoupling`. Provider real e Dimona não foram chamados; produção/envio, referral, attribution, comissões, payout e shipment não foram tocados. T1 permanece não iniciado.

### Registro imediatamente anterior
FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa. Objetivo: readiness interno para payment.approved com fronteira transacional segura. Esta frente não é cutover externo. Esta frente não valida pagamento homologado com provedor real. Esta frente não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta frente não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. payment.approved atualmente cruza produção e financeiro; esta frente existe para analisar e desacoplar esse risco antes de qualquer prova de aprovação. FRONT_ORDER_CHECKOUT_PAYMENT_READINESS permanece pausada como PARCIAL fortalecida, não DONE. As evidências cbdfc91/f1645a2, 349b21f/92778d6 e 90519b0/0b027bc permanecem preservadas como readiness interno até order placed e payment processing. Primeiro passo da nova frente: inventário técnico e contratual do fluxo payment.approved, webhook inbox, transação de aprovação e outbox durável, sem alteração de código. T1 permanece não iniciado.

FRONT_ORDER_CHECKOUT_PAYMENT_READINESS pausada como PARCIAL fortalecida. FRONT_ORDER_CHECKOUT_PAYMENT_READINESS não está DONE. A frente provou readiness interno até pedido placed e payment processing. A frente não validou payment.approved. A frente não validou webhook approved. A frente não validou pagamento homologado com provedor real. A frente não validou cutover externo, HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. A frente não validou produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. payment.approved cruza produção e financeiro e exige nova frente/autorização explícita. Bloqueio registrado: BLOCKED_BY_PAYMENT_APPROVED_CROSSES_PRODUCTION_FINANCE_DOMAINS. As evidências preservadas são cbdfc91/f1645a2, 349b21f/92778d6 e 90519b0/0b027bc. O guardrail qa:order:status:honesty é estático e não substitui prova browser/runtime. Nenhum domínio foi promovido a DONE. Nenhum novo front foi aberto. T1 permanece não iniciado.

ORDER_CHECKOUT_STATUS_COPY_HONESTY_REPAIR registrada como terceira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 90519b0 fix(checkout): make processing status copy honest. Resultado: qa:order:status:honesty PASS. Classificação: QA_ORDER_CHECKOUT_STATUS_COPY_HONESTY_PASS. ORD-STATUS-01 a ORD-STATUS-04 passaram. Esta evidência corrige a apresentação visual para não tratar payment processing como approved. Esta evidência corrige a apresentação visual para não tratar pedido placed como paid ou concluído. CheckoutSuccessCard não afirma produção iniciada para payment processing. /success não vende pagamento aprovado sem estado real. account/orders passa a exibir paymentStatus separadamente. Esta evidência é guardrail estático, não prova browser/runtime. Payment permanece processing e pedido permanece placed. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida webhook approved. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta evidência não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Esta evidência não declara MVP pronto. Nenhuma migration foi criada. T1 permanece não iniciado.

ORDER_CREATION_IDEMPOTENCY_REPAIR registrada como segunda evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 349b21f fix(orders): make checkout order creation idempotent. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-12 passaram. A correção impede que retry completo do checkout crie pedido órfão. Mesma tentativa autenticada com mesmo payload retorna o mesmo orderId. Mesma tentativa com payload incompatível retorna 409 order_idempotency_conflict. Outro customer possui namespace próprio; checkout continua idempotente no mesmo pedido e associação cruzada de payment continua bloqueada. Payment permanece processing e pedido permanece placed, nunca paid. A migration `infra/mysql/migrations/003_order_creation_idempotency.sql` dá durabilidade e segurança de concorrência ao mapeamento `customerId + idempotencyKey/tentativa -> orderId + payloadHash`, com chave única composta e FK para `orders`; não altera payment, webhook, produção/envio, referral, payout ou RBAC. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida webhook approved. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta evidência não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Esta evidência não declara MVP pronto. Copy/status visual de /success e CheckoutSuccessCard permanecem lacuna futura. O build do runner executa `qa:product:guardrails` como pré-condição estática; nenhum gate funcional amplo foi executado diretamente. Nenhuma rota proibida foi chamada; webhook approved não foi chamado e produção/envio, referral, attribution, comissões, payout, Dimona e provider real não foram tocados. T1 permanece não iniciado.

QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION registrada como primeira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: cbdfc91 fix(payments): scope checkout idempotency by order. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-10 passaram. A correção impede reutilização cruzada de x-idempotency-key entre pedidos diferentes. Mesma x-idempotency-key para o mesmo pedido retorna o mesmo payment. Mesma x-idempotency-key para outro pedido retorna 409 idempotency_key_order_conflict. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real, webhook approved, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Nenhuma migration foi criada. T1 permanece não iniciado.

## Abertura da frente
Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida webhook approved. Esta evidência não valida produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Esta evidência não declara MVP pronto.

FRONT_ORDER_CHECKOUT_PAYMENT_READINESS aberta como frente ativa por autorizacao humana explicita. Objetivo: readiness interno de pedido, checkout, webhook assinado e status, com MySQL QA isolado e sessão real. Esta frente não é cutover externo. Esta frente não valida pagamento homologado com provedor real, HML externa, Base URL pública, inscrição real de webhook ou transação real de provedor. Primeiro passo da nova frente: inventário técnico e documental dos fluxos de pedido, checkout, pagamento, webhook e status, sem alteração de código. FRONT_3_CATALOG_CURATION_HARDENING e FRONT_QA_GATE_GOVERNANCE_CLEANUP permanecem pausadas como PARCIAL fortalecida. T1 permanece não iniciado.

## Bloqueio atual
A primeira evidência interna da frente está registrada, mas não autoriza consumidor de outbox, execução de efeitos downstream, homologação externa ou cutover. O próximo recorte deve ser reavaliado e autorizado explicitamente antes de qualquer implementação ou gate funcional adicional.

### Bloqueio anterior de abertura, superado somente pelo recorte comprovado
A autorizacao humana explicita removeu `BLOCKED_BY_PAYMENT_APPROVED_CROSSES_PRODUCTION_FINANCE_DOMAINS` somente para o inventario e a analise de desacoplamento desta nova frente. `payment.approved` ainda marca o pedido como `paid` e cruza producao e financeiro; nenhuma execucao funcional ou alteracao desse fluxo esta autorizada nesta abertura.

Provider real, HML e cutover permanecem fora e dependem de credenciais, webhook secret, Base URL publica e janela operacional. `FRONT_5_REAL_PAYMENTS_CUTOVER` permanece bloqueada por dependencia externa e nao e a frente ativa. FRONT_3 continua pausada com lacunas de rejeicao auditavel de Artwork, auditoria duravel, midia, SEO e staging.

O risco real agora e:
- promover campanhas de `PARCIAL` para dominio maduro sem evidencia nova;
- abrir `Organization`, membership, reward financeiro proprio ou rotas paralelas por fora do recorte;
- reabrir W1-W8 como se fossem frentes atuais;
- promover pagamento real para `IMPLEMENTADO` sem evidencia operacional externa;
- tratar readiness local como homolog final fora de `localhost`.
- expandir o recorte interno para producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout.

## Evidencia
- PAYMENT_APPROVED_TRANSACTIONAL_OUTBOX_ISOLATION: commit técnico `fc05f9d fix(payments): decouple approved payment effects with outbox`; `qa:payment:approved:decoupling PASS`; classificação `QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS`; PAY-APP-01 a PAY-APP-10 passaram. Webhook approved assinado obrigatório, transação MySQL única para Payment/Order/inbox/payment event/outbox, rollback sem estado parcial, retry sequencial e concorrente sem duplicação e delta downstream zero. A migration 004 cria somente o outbox PaymentApproved durável; nenhum consumidor foi implementado. Readiness interno apenas, sem cutover, provider real, HML externa, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. O build executou `qa:product:guardrails` como pré-condição estática; o único gate funcional executado diretamente foi o gate específico. T1 permanece não iniciado.
- Abertura documental: FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS aberta como frente ativa por autorizacao humana explicita. O recorte e readiness interno da fronteira transacional de `payment.approved`; nao e cutover externo, nao valida provedor real, HML externa, Base URL publica, webhook real, transacao real, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. Primeiro passo: inventario tecnico e contratual sem alteracao de codigo e sem gate funcional. T1 permanece nao iniciado.
- Pausa documental: FRONT_ORDER_CHECKOUT_PAYMENT_READINESS esta PARCIAL fortalecida, nao DONE. As evidencias preservadas sao `cbdfc91`/`f1645a2` para checkout/payment idempotente por pedido, `349b21f`/`92778d6` para criacao idempotente de pedido por tentativa e `90519b0`/`0b027bc` para honestidade visual de status/copy. A frente provou readiness interno ate pedido `placed` e payment `processing`; nao validou `payment.approved`, webhook approved, pagamento homologado, cutover externo, HML externa, Base URL publica, inscricao real de webhook, transacao real de provedor, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. `qa:order:status:honesty` e guardrail estatico e nao substitui prova browser/runtime. Bloqueio: `BLOCKED_BY_PAYMENT_APPROVED_CROSSES_PRODUCTION_FINANCE_DOMAINS`. Nenhum dominio foi promovido a DONE, nenhum novo front foi aberto e T1 permanece nao iniciado.
- ORDER_CHECKOUT_STATUS_COPY_HONESTY_REPAIR registrada como terceira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 90519b0 fix(checkout): make processing status copy honest. Resultado: qa:order:status:honesty PASS. Classificação: QA_ORDER_CHECKOUT_STATUS_COPY_HONESTY_PASS. ORD-STATUS-01 a ORD-STATUS-04 passaram. Esta evidência corrige a apresentação visual para não tratar payment processing como approved e pedido placed como paid ou concluído. CheckoutSuccessCard não afirma produção iniciada para payment processing; /success não vende pagamento aprovado sem estado real; account/orders passa a exibir paymentStatus separadamente. Esta evidência é guardrail estático, não prova browser/runtime. Payment permanece processing e pedido permanece placed. Esta evidência é readiness interno, não cutover externo. Não valida pagamento homologado com provedor real, webhook approved, HML externa, Base URL pública, inscrição real de webhook, transação real de provedor, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout e não declara MVP pronto. Nenhuma migration foi criada. T1 permanece não iniciado.
- ORDER_CREATION_IDEMPOTENCY_REPAIR registrada como segunda evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: 349b21f fix(orders): make checkout order creation idempotent. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-12 passaram. A correção impede que retry completo do checkout crie pedido órfão. Mesma tentativa autenticada com mesmo payload retorna o mesmo orderId. Mesma tentativa com payload incompatível retorna 409 order_idempotency_conflict. Outro customer possui namespace próprio; checkout continua idempotente no mesmo pedido e associação cruzada de payment continua bloqueada. Payment permanece processing e pedido permanece placed, nunca paid. A migration `infra/mysql/migrations/003_order_creation_idempotency.sql` registra `customerId + idempotencyKey/tentativa -> orderId + payloadHash`, com chave única composta e FK para `orders`, para durabilidade e concorrência; não altera payment, webhook, produção/envio, referral, payout ou RBAC. Esta evidência é readiness interno, não cutover externo. Esta evidência não valida pagamento homologado com provedor real. Esta evidência não valida webhook approved. Esta evidência não valida HML externa, Base URL pública, inscrição real de webhook, transação real de provedor, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout e não declara MVP pronto. Copy/status visual de /success e CheckoutSuccessCard permanecem lacuna futura. O build do runner executa `qa:product:guardrails` como pré-condição estática; nenhum gate funcional amplo foi executado diretamente. Nenhuma rota proibida foi chamada; webhook approved não foi chamado e produção/envio, referral, attribution, comissões, payout, Dimona e provider real não foram tocados. T1 permanece não iniciado.
- QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION registrada como primeira evidência técnica da FRONT_ORDER_CHECKOUT_PAYMENT_READINESS. Commit técnico: cbdfc91 fix(payments): scope checkout idempotency by order. Resultado funcional: npm run qa:order:checkout:readiness PASS. Classificação: QA_ORDER_CHECKOUT_AUTHORIZATION_IDEMPOTENCY_ISOLATION_PASS. ORD-CHK-01 a ORD-CHK-10 passaram. A correção impede reutilização cruzada de x-idempotency-key entre pedidos diferentes. Mesma x-idempotency-key para o mesmo pedido retorna o mesmo payment. Mesma x-idempotency-key para outro pedido retorna 409 idempotency_key_order_conflict. Durante runner/build, qa:product:guardrails pode ser executado como pré-condição estática; nenhum gate funcional amplo foi executado diretamente. Nenhum webhook approved foi chamado. Esta evidência é readiness interno, não cutover externo, e não valida pagamento homologado com provedor real, webhook approved, produção/envio, Dimona, affiliate, referral, attribution, comissões ou payout. Nenhuma migration foi criada. T1 permanece não iniciado.
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
- `4cbb75e` (tecnico) e `b213fba` (documental): `qa:catalog:curation PASS` vigente para `QA_CATALOG_CURATION_ISOLATION`, cobrindo a cadeia positiva de curadoria/catalogo.
- `9d00b01` (tecnico) e `a4afcb7` (documental): `qa:catalog:authority PASS` vigente para `QA_CATALOG_AUTHORITY_RESTART_ISOLATION`, cobrindo a autoridade MySQL apos restart controlado.
- `3dc9134` (tecnico) e `60580ea` (documental): `qa:catalog:lifecycle PASS` vigente para `QA_CATALOG_LIFECYCLE_REVERSAL_ISOLATION`, cobrindo reversao publica `published -> archived -> draft -> ready -> published`.
- `8b4ee58`: QA_GATE_ALIAS_QUARANTINE colocou `qa:catalog` e `qa:full` em quarentena/fail-fast explicito. qa:catalog:curation, qa:catalog:authority e qa:catalog:lifecycle permanecem como gates vigentes de catalogo com evidencia propria. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- `9ae24f3`: QA_ROLE_CLOSURE_ALIAS_QUARANTINE registrada como segunda acao tecnica da FRONT_QA_GATE_GOVERNANCE_CLEANUP. qa:role:closure foi colocado em quarentena/fail-fast explicito para evitar falso PASS e falsa cobertura de fechamento por papeis; e um alias legado e nao e evidencia funcional vigente. Eventual retomada de role closure exige recorte isolado e autorizacao humana explicita. qa:base:roles e pr:premerge permanecem inalterados nesta acao. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- `4390f1a`: QA_BASE_ROLES_ALIAS_QUARANTINE registrada como terceira acao tecnica da FRONT_QA_GATE_GOVERNANCE_CLEANUP. qa:base:roles foi colocado em quarentena/fail-fast explicito para evitar falso PASS e falsa cobertura de maturidade por papeis; e um alias legado/amplo e nao e evidencia funcional vigente. Eventual retomada de base roles exige decomposicao em recortes isolados e autorizacao humana explicita. pr:premerge permanece inalterado nesta acao. Esta acao nao executa gates funcionais e nao valida maturidade completa do sistema. Esta acao nao altera produto, dominio, RBAC, migrations ou fluxos de negocio. Financeiro, pedido, checkout, pagamento, webhook, producao/envio, affiliate, referral, attribution, payout e Dimona continuam fora. T1 permanece nao iniciado.
- Pausa documental: FRONT_QA_GATE_GOVERNANCE_CLEANUP esta PARCIAL fortalecida, nao DONE. Os commits tecnicos/documentais das quarentenas sao `8b4ee58`/`8f76da2` para qa:catalog e qa:full, `9ae24f3`/`acb443e` para qa:role:closure e `4390f1a`/`a3dcaf3` para qa:base:roles. `pr:premerge` e governanca estatica de PR, nao evidencia funcional; `qa:catalog:persisted` e historico/referencial baseado em SQLite/dev/header/.tmp-store, nao evidencia vigente de autoridade de catalogo. Os gates vigentes separados sao qa:catalog:curation, qa:catalog:authority e qa:catalog:lifecycle. Nenhum novo front foi aberto; T1 permanece nao iniciado.
- Autorizacao humana explicita: FRONT_ORDER_CHECKOUT_PAYMENT_READINESS aberta como frente ativa, limitada a readiness interno de pedido, checkout, webhook assinado e status, com MySQL QA isolado e sessao real. Nao e cutover externo e nao valida pagamento homologado com provedor real.

## Proximo passo exato
Reavaliar documental e tecnicamente a FRONT_PAYMENT_APPROVED_DECOUPLING_READINESS após sua primeira evidência vigente. Não implementar consumidor de outbox, não executar novo gate funcional e não ampliar para efeitos downstream ou cutover sem autorização humana explícita. Preservar `fc05f9d` e `QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS` como readiness interno limitado. T1 permanece não iniciado.

### Passo anterior concluido
Executar somente o inventario tecnico e contratual do fluxo `payment.approved`, webhook inbox, transacao de aprovacao e outbox duravel, sem alterar codigo e sem executar gate funcional. Identificar atomicidade, idempotencia, efeitos downstream e fronteiras entre pagamento, pedido, producao e financeiro. Parar antes de implementar, migrar banco, alterar RBAC, chamar webhook approved, tocar provider real/HML/cutover ou expandir para producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. T1 permanece nao iniciado.

## Passo anterior
Inventariar tecnicamente e documentalmente os fluxos de pedido, checkout, pagamento, webhook e status, sem alteracao de codigo e sem executar gates funcionais. Parar se o recorte exigir HML externa, Base URL publica, inscricao real de webhook, transacao de provedor, producao/envio, Dimona, affiliate, referral, attribution, comissoes ou payout. T1 permanece nao iniciado.

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
