# Execution Tracking (Status + Ciclo + Evidencias)

Data de revisao: 2026-05-23

Atualizacao adicional: 2026-05-25
- Roadmap seguro de execucao para 2026-05-26 publicado em:
  - `docs/ROADMAP_2026-05-26_SAFE_EXECUTION.md`
- Pendencias abertas de 2026-05-25 foram consolidadas no roadmap com gatilho `GO/NO-GO` e fases bloqueantes.

Atualizacao adicional: 2026-05-26 (Fase 2 - compatibilidade de sessao)
- Modelo de sessao estendido com compatibilidade para:
  - `roles[]`
  - `activeRole`
  - preservacao de `userRole` legado para retrocompatibilidade
- Normalizacao central de sessao criada em `lib/auth-session.ts` (`normalizeAuthSession`).
- Fluxo de auth atualizado sem quebra de contrato:
  - `app/api/auth/session/route.ts` passa a normalizar payload legado/novo.
  - `lib/auth-local-users.ts` passa a emitir `roles[]` e `activeRole`.
  - `lib/access-control.ts` passa a usar `activeRole` como fonte de autorizacao.
- Evidencias de gate apos fase 2:
  - `npm run check:strict`: PASS (2026-05-26)
  - `npm run qa:ux:journeys`: PASS (2026-05-26)
  - `qa:coreops` em porta limpa (`3320`): PASS (2026-05-26)
  - `qa:functional` em porta limpa (`3316`): PASS (2026-05-26)

Atualizacao adicional: 2026-05-26 (Fase 3 - hardening de guardas)
- Guardas de acesso reforcados nas rotas criticas:
  - `/login`: sessao ativa agora exibe decisao explicita (continuar com conta atual, trocar conta, ou cadastrar), sem redirecionamento forcado.
  - `/account/*`: layout de conta agora bloqueia roles administrativos e redireciona para home correta por role.
  - `/admin/production`: tratamento explicito de `401/403` com fallback para login.
  - `/admin/payments/connectors`: tratamento explicito de `401/403` em load/teste para evitar estado silencioso sem permissao.
- QA operacional ajustado para previsibilidade:
  - `qa:coreops` agora explicita `ALLOW_HEADER_ACTOR_FALLBACK=true` no comando local para evitar falso negativo quando RBAC esta ativo em ambiente de teste.
- Evidencias de gate apos fase 3:
  - `npm run check:strict`: PASS (2026-05-26)
  - `npm run qa:ux:journeys`: PASS (2026-05-26)
  - `qa:coreops` em porta limpa (`3324`): PASS (2026-05-26)
  - `qa:functional` em modo `start` e porta limpa (`3319`): PASS (2026-05-26)

Atualizacao adicional: 2026-05-26 (Fase 4 - gate final de liberacao)
- Gate final executado com evidencias:
  - `npm run check:strict`: PASS (2026-05-26)
  - `npm run qa:ux:journeys`: PASS (2026-05-26)
  - `qa:coreops` em porta limpa (`3325`): PASS (2026-05-26)
  - `qa:functional` em modo `start` e porta limpa (`3327`): PASS (2026-05-26)
- Observacao operacional:
  - ambiente `next dev` apresentou intermitencias de cache/hot-reload durante algumas rodadas; validacao final foi consolidada em execucao limpa e reproduzivel.
  - `qa:functional` reporta diagnosticos de frontend (`React #418` minificado em contexto de hidratacao e recursos 404 nao criticos), sem quebra das jornadas funcionais validadas.
- Veredito de release interno: `GO` para continuidade do roadmap com monitoramento dos diagnosticos frontend em backlog de hardening.

Atualizacao adicional: 2026-05-26 (Checkpoint de coerencia RBAC runtime - 4 papeis ativos)
- Escopo validado no runtime atual: `customer`, `support_agent`, `production_operator`, `platform_admin`.
- Confirmacao de arquitetura:
  - guardas de acesso concentrados em `app/account/layout.tsx` e `app/admin/layout.tsx`;
  - sem duplicacao de redirecionamento de RBAC em paginas filhas de dominio (`app/account/*`, `app/admin/*`).
- Evidencias de validacao do checkpoint:
  - `npm run check:strict`: PASS (2026-05-26)
  - `npm run qa:ux:journeys`: PASS (2026-05-26)

Atualizacao adicional: 2026-05-26 (Execucao ponta a ponta - gates funcionais em serie)
- Execucao fim-a-fim concluida em portas limpas e sequenciais:
  - `qa:coreops` (`QA_PORT=3336`): PASS
  - `qa:functional` (`QA_PORT=3337`): PASS
- Causa raiz de falha intermitente identificada e mitigada:
  - execucao paralela de dois `next dev` no mesmo workspace gerou instabilidade de cache `.next` (erros `ENOENT pack.gz` e `TypeError ... reading 'call'`).
  - mitigacao aplicada: limpar `.next` e executar gates em serie (um runner por vez).

Atualizacao adicional: 2026-05-26 (Validacao em modo producao `start`)
- Validacao em runtime de producao concluida com execucao serial:
  - `qa:functional` (`QA_SERVER_MODE=start`, `QA_PORT=3339`): PASS
  - `qa:coreops` (`QA_SERVER_MODE=start`, `QA_PORT=3340`): PASS
- Observacoes nao bloqueantes:
  - warning de `metadataBase` ausente em metadata (OpenGraph/Twitter) durante build/start.
  - diagnostico recorrente `React #418` em execucao minificada do `qa:functional` (sem quebra das jornadas validadas).

Atualizacao adicional: 2026-05-26 (Fechamento dos pontos identificados de hardening)
- `metadataBase` configurado em `app/layout.tsx` com URL canonica de producao para remover warning de metadata em build/start.
- Checkout ajustado para evitar dependencia de data dinamica no SSR em etapa de entrega:
  - `components/checkout/CheckoutPageView.tsx` agora usa previsao deterministica por prazo (`em X dias úteis`) na renderizacao inicial.
- Evidencias apos ajuste:
  - `npm run check:strict`: PASS (2026-05-26)
  - `qa:functional` em `start` (`QA_PORT=3341`): PASS
  - `qa:functional` em `dev` (`QA_PORT=3342`): PASS
- Investigacao do diagnostico `React #418`:
  - causa raiz identificada: hidratação divergente de carrinho entre SSR e cliente por leitura de `localStorage` no estado inicial de render em `context/CartContext.tsx`.
  - correcao aplicada: carga do carrinho movida para pos-mount (assíncrona), com escrita em `localStorage` condicionada a `isCartHydrated`.
  - instrumentacao de diagnostico em `scripts/qa-functional.mjs` para incluir URL em `pageerror`.
  - evidencia final apos correcao:
    - `npm run check:strict`: PASS (2026-05-26)
    - `qa:functional` em `start` (`QA_PORT=3344`): PASS sem `diagnostics`
    - `qa:coreops` em `start` (`QA_PORT=3345`): PASS

Atualizacao adicional: 2026-05-26 (Expansao de papeis no runtime - fase inicial concluida)
- Modelo de sessao/autenticacao local expandido para incluir papeis de negocio:
  - `finance_admin`
  - `artist`
  - `community_manager`
- Ajustes de navegacao/RBAC aplicados:
  - `lib/auth-session.ts`: `UserRole` e validacao de roles atualizados.
  - `lib/auth-local-users.ts`: usuarios de desenvolvimento adicionais para os novos papeis.
  - `lib/access-routing.ts`: `finance_admin` tratado como papel administrativo; `artist/community_manager` com home em `/account`.
- Evidencias de validacao apos expansao:
  - `npm run check:strict`: PASS (2026-05-26)
  - `qa:functional` em `start` (`QA_PORT=3346`): PASS
  - `qa:coreops` em `start` (`QA_PORT=3347`): PASS

Atualizacao adicional: 2026-05-27 (P3 cutover real - status de bloqueio objetivo)
- Diagnostico de bloqueio executado:
  - `npm run alert:critical`: FAIL (`CRIT-PAY-REAL-001` e `CRIT-PAY-REAL-002`)
  - `npm run qa:providers:ready`: `NOT_READY` (0 providers configurados)
- Bloqueios atuais para concluir 100% de producao:
  - nenhum provider real com credenciais completas no ambiente atual;
  - persistencia final MySQL gerenciada nao configurada (`PAYMENT_PERSISTENCE=mysql` + `DATABASE_URL` mysql).
- Pendencias minimas para destravar P3:
  - escolher provider oficial (Inter / InfinitePay / Mercado Pago / Pagar.me / Cielo / Stripe);
  - configurar variaveis obrigatorias do provider escolhido;
  - configurar persistencia MySQL gerenciada;
  - executar smoke do provider + `qa:payments21` + `qa:coreops` em ambiente de homolog.
  - `npm run p3:precheck`: FAIL (`missing_global_env`) com faltas em `HML_BASE_URL`, `PAYMENT_PROVIDER`, `PAYMENT_WEBHOOK_SECRET`.
- Pacote de ativacao imediata preparado:
  - `docs/P3_ENV_READY_TO_FILL.md` com bloco pronto de `.env` (copiar/colar), matriz por provider e sequencia de validacao.
  - `infra/env/.env.p3.template` criado para setup rapido.
  - `p3:plug`/`p3:plug:run` criados para dry-run e execucao sequencial de P3.
  - `go:preflight`/`go:preflight:run` criados para preflight de go-live em comando unico.
  - Execucao real `npm run p3:plug:run` validada: bloqueio ocorreu corretamente em `p3:precheck` por falta de env global.

Atualizacao adicional: 2026-05-27 (Execucao de pontos nao bloqueados enquanto P3 fica por ultimo)
- Ajustes aplicados de UX/RBAC sem dependencia de credenciais:
  - `app/admin/page.tsx`: correcoes de textos com encoding residual e habilitacao de modulos para `finance_admin`.
  - `app/account/orders/page.tsx`: normalizacao de copy com encoding estavel.
  - `scripts/qa-functional.mjs`: suite `guest_navigation` aceita fluxo valido `Shop -> /account` ou `Shop -> /login` para visitante sem sessao.
- Evidencias:
  - `npm run check:strict`: PASS (2026-05-27)
  - `qa:functional` em `start` (`QA_PORT=3349`): PASS
- Ajuste adicional de robustez:
  - `scripts/qa-functional.mjs`: normalizacao de textos de output com encoding estavel e aceitacao explicita de redirecionamento valido `Shop -> /login` para visitante.
- Evidencias apos ajuste:
  - `npm run check:strict`: PASS (2026-05-27)
  - `qa:functional` em `start` (`QA_PORT=3350`): PASS
- Observacao:
  - `npm run qa:reconcile:ops` depende de `RECON_BASE_URL|QA_BASE_URL` + `DATABASE_URL`; mantido para execucao assim que ambiente de reconciliacao estiver disponivel.

Atualizacao adicional: 2026-05-27 (Auditoria tecnica 99% - frontend/backend/seguranca)
- Bateria de validacao executada:
  - `npm run check:strict`: PASS
  - `qa:payments21` em `start` (`QA_PORT=3351`): PASS
  - `qa:exceptions` em `start` (`QA_PORT=3353`, `ALLOW_HEADER_ACTOR_FALLBACK=true`): PASS
  - `qa:coreops` em `start` (`QA_PORT=3356`, `ALLOW_HEADER_ACTOR_FALLBACK=true`): PASS
  - `qa:functional` em `start` (`QA_PORT=3355`): PASS
- Revisao de seguranca estatica (scan de codigo) sem segredo hardcoded detectado; uso de fallback por header permanece restrito a dev/flag explicita.
- Bloqueio residual unico para 100%:
  - `npm run alert:critical`: FAIL por `CRIT-PAY-REAL-001/002` (credenciais/provider real + MySQL gerenciado ausentes).
  - `npm run p3:precheck`: FAIL por env global ausente (`HML_BASE_URL`, `PAYMENT_PROVIDER`, `PAYMENT_WEBHOOK_SECRET`).

## Status atual por onda (plano anti-retrabalho)

- Ativacao P3 por provider consolidada em comando unico: `npm run qa:provider:activate` (sequencia gate + smoke + regressao).
- Alertas criticos agora sao dinâmicos por ambiente (`scripts/critical-alerts.mjs`) e nao mais texto estatico.
- Regra self-service unificada para todos os providers aplicada: habilitacao via painel de conectores, sem dependencia de `PAYMENT_ENABLE_*`.
- Painel de conectores com requisitos dinamicos por provider e bloqueio de ativacao incompleta (`lib/payment-provider-requirements.ts` + `app/api/admin/payment-connectors/route.ts` + `app/admin/payments/connectors/page.tsx`).

- P0 Estrutural: `CONCLUIDO`
  - Fonte unica de schema consolidada em `infra/mysql/init/001_payments.sql`.
  - `lib/mysql-runtime.ts` reduzido para aplicar schema oficial + validacao minima.
  - Catalogo migrado para persistencia transacional no mesmo padrao dos demais dominios (`lib/catalog-item-store.ts` + tabela `catalog_items`).
- P1 Confiabilidade QA: `CONCLUIDO`
  - Runner QA corrigido para Windows (`scripts/qa-api-runner.mjs` e `scripts/qa-functional-runner.mjs`).
  - Evidencias de gate:
    - `npm run check`: PASS (2026-05-23)
    - `npm run qa:full`: PASS (2026-05-23)
- P2 Front integrado: `EM ANDAMENTO`
  - `account/orders` removido de dataset local e conectado a API real (`GET /api/orders`).
  - `admin/production` removido de `PRODUCTION_LENS` hardcoded e conectado a `GET /api/production-jobs`.
  - Camada HTTP unica criada em `lib/http-client.ts`.
  - Checkout passou a usar camada HTTP unica (`components/checkout/CheckoutPageView.tsx`).
  - Gate tecnico validado apos mudancas: `npm run qa:full` PASS (2026-05-23).
  - Read-model operacional unificado para `order -> payment -> production -> shipment -> support` em `lib/order-operational-view.ts`.
  - Endpoints `orders/:orderId/status` e `support/orders/:orderId/context` passaram a consumir a mesma fonte agregada.
- P3 Gateway real e cutover: `PENDENTE` (bloqueado pelos alertas `CRIT-PAY-REAL-001/002`).
- P4 Hardening final: `PENDENTE`.
- Regra de arquitetura formalizada: guardas de acesso devem ficar concentrados nos `layout.tsx` de dominio (ex.: `app/account/layout.tsx`, `app/admin/layout.tsx`), evitando duplicacao de regra em `page.tsx`.
- Plano mestre de continuidade tecnica publicado: `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`.
- Gate automatico de mudanca critica criado: `npm run pr:gate` (`scripts/critical-pr-gate.mjs`).
- Integridade de dados reforcada no schema MySQL com FKs e indices operacionais em `infra/mysql/init/001_payments.sql`.
- Script de reconciliacao operacional API x banco criado: `npm run qa:reconcile:ops`.
- Impact check automatizado por dominio critico criado: `npm run pr:impact` (`scripts/impact-check.mjs`).
- Fluxo unico obrigatorio de pre-merge criado: `npm run pr:premerge` (`check + pr:gate + pr:impact`).
- CI de PR atualizado para bloquear merge quando `pr:premerge` falhar (`.github/workflows/quality-and-smoke.yml`).
- Checklist oficial de revisao de tela frontend publicado: `docs/FRONTEND_SCREEN_REVIEW_CHECKLIST.md`.
- Achados medios resolvidos:
  - encoding corrigido em dados de categoria (`components/category/category-data.ts`);
  - suporte interno separado de pagina institucional via rota operacional `app/admin/support/page.tsx`.
- Onda 1 (Workflow/RBAC): `CONCLUIDA`
  - Matriz operacional de acesso publicada: `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`.
  - Fluxos de sessao/negacao consolidados em layout de conta/admin e rotas protegidas.
- Onda 2 (Checkout/Payment): `CONCLUIDA` (escopo local desta fase)
  - Relatorio de edge cases publicado: `docs/CHECKOUT_PAYMENT_EDGE_CASES_REPORT.md`.
  - Checkout endurecido para erros de autenticacao/permissao e indisponibilidade transitoria.
- Gate de onda executado: `npm run pr:premerge` PASS (2026-05-23).
- Onda 3 (Support/Ops): `CONCLUIDA`
  - Separacao cliente x operacao aplicada com hub de suporte interno (`/admin/support`).
  - Fluxo operacional consolidado com rota dedicada `app/admin/support/[orderId]/page.tsx` (ticket -> pedido -> contexto -> resposta).
  - Hardening em pedidos para evitar `500` por percentual invalido em ambiente (`lib/order-store.ts`, `safePct`).
  - Evidencias de QA de dominio:
    - `npm run qa:coreops`: PASS (2026-05-23, porta 3202, RBAC ativo).
    - `npm run qa:exceptions`: PASS (2026-05-23, porta 3203, RBAC ativo).
  - Gate tecnico de onda: `npm run pr:premerge` PASS (2026-05-23).
- P3 Gateway real e cutover: `LIBERADO PARA EXECUCAO` (dependente de credenciais/ambiente de homolog).
- P4 Hardening final: `LIBERADO APOS P3`.
- Multi-gateway (fase 1): `CONCLUIDO`
  - Registry de providers publicado (`lib/payment-gateway-registry.ts`).
  - Checkout com escolha de gateway pelo usuario (`components/checkout/sections/CheckoutStepTwoSection.tsx`).
  - Persistencia do provider em `PaymentRecord` + store/schema.
  - Webhook preparado para resolver provider por header/body/reference.
  - Evidencia tecnica: `npm run qa:payments21` PASS (2026-05-23).

## Objetivo
Concentrar acompanhamento de execucao em uma fonte unica, reduzindo duplicidade entre status, planejamento semanal e evidencias P0.

## Regra de governanca
- Este e o documento oficial de acompanhamento de execucao.
- Atualizacoes de status semanal, ciclo ativo e evidencias P0 devem ocorrer aqui.
- Os documentos legados foram redirecionados para este arquivo.

## KPIs semanais de governanca (COBIT/ITIL)
- `% PR critico com checklist completo`.
- `% release com evidencia P0 vinculada`.
- `tempo medio de rollback testado (min)`.
- `emergencies com RCA aberta em ate 24h`.

---

## Bloco 1 - Matriz de Status
# Execution Status Matrix (Existe / Parcial / Ausente)

Data de revisao: 2026-05-21

## Objetivo
Mostrar, de forma operacional, o que já existe no projeto, onde está implementado e o que ainda não existe por domínio.

## Legenda
- `EXISTE`: implementado e integrado no fluxo atual.
- `PARCIAL`: existe base/UX/sandbox, mas falta fechamento de produção.
- `AUSENTE`: não implementado no código atual.

## Alertas Criticos (nao perder de vista)
- `CRIT-PAY-REAL-001`: gateway real de pagamento ainda nao homologado em producao.
- `CRIT-PAY-REAL-002`: persistencia final de pagamentos em ambiente gerenciado ainda pendente.
- Comando de revisao rapida: `npm run alert:critical`.

## 1) Produto e Checkout (UI/UX)
- PDP com seções estratégicas: `EXISTE`
  - `components/product/ProductPageView.tsx`
- Prova social (tags + notas): `EXISTE`
  - `components/commerce/ProductSocialProof.tsx`
- Q&A público na PDP: `EXISTE`
  - `components/commerce/ProductQA.tsx`
- Zoom/mídia de detalhes: `PARCIAL` (estrutura pronta, acervo real pendente)
  - `components/commerce/ProductMediaGallery.tsx`
  - `components/product/product-data.ts`
- Provador virtual (altura/peso/caimento): `EXISTE`
  - `components/commerce/ProductSizeAdvisor.tsx`
- Checkout 1 clique (pix/carteira): `EXISTE` (fluxo sandbox)
  - `components/commerce/ProductInteractive.tsx`
  - `components/checkout/sections/CheckoutStepTwoSection.tsx`

## 2) Pagamentos
- Contrato de API checkout/status/webhook: `EXISTE`
  - `app/api/payments/checkout/route.ts`
  - `app/api/payments/status/[paymentId]/route.ts`
  - `app/api/payments/webhook/route.ts`
- Idempotência e assinatura de webhook: `EXISTE`
  - `lib/payment-service.ts`
  - `components/checkout/CheckoutPageView.tsx`
- Provider real (gateway externo): `PARCIAL` (adapter homologado `gateway_sandbox` implementado; integracao com provedor externo real pendente)
- Persistência em banco (pagamentos): `PARCIAL` (sqlite relacional local com fallback, banco gerenciado de producao pendente)
  - `lib/payment-store.ts`
  - `lib/dev-store.ts`
- Trilha de eventos de pagamento no status API: `EXISTE`
  - `lib/payment-store.ts`
  - `lib/payment-service.ts`
  - `app/api/payments/status/[paymentId]/route.ts`
- Excecoes operacionais (`cancel`, `refund`, `chargeback`) com idempotencia: `EXISTE`
  - `app/api/orders/[orderId]/cancel/route.ts`
  - `app/api/refunds/route.ts`
  - `app/api/refunds/[refundId]/approve/route.ts`
  - `app/api/refunds/[refundId]/reject/route.ts`
  - `app/api/chargebacks/webhook/route.ts`

## 3) Pedidos e Logística
- Fluxo UX checkout -> success: `EXISTE`
  - `components/checkout/CheckoutPageView.tsx`
- Modelo operacional de produção/envio (backend local): `EXISTE` (transições críticas com RBAC + QA core operacional validado)
  - `app/api/orders/route.ts`
  - `app/api/production-jobs/route.ts`
  - `app/api/production-jobs/[id]/start/route.ts`
  - `app/api/production-jobs/[id]/ship/route.ts`
  - `app/api/shipments/[orderId]/route.ts`
  - `lib/order-store.ts`
  - `lib/production-store.ts`
  - `lib/shipment-store.ts`
  - `lib/dev-store.ts`

## 4) Catálogo e Curadoria
- DoD completo definido: `EXISTE` (documentação)
  - `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Estrutura de PDP e apresentação de item vendável: `PARCIAL` (leitura real de item publicado; acervo e curadoria ainda evoluindo)
  - `app/product/[id]/page.tsx`
  - `components/product/ProductPageView.tsx`
  - `components/product/product-data.ts`
- Implementação backend de submissão/revisão/publicação: `PARCIAL`
  - `app/api/artworks/route.ts`
  - `app/api/artworks/[id]/approve/route.ts`
  - `app/api/artworks/[id]/reject/route.ts`
  - `app/api/catalog-items/route.ts`
  - `app/api/catalog-items/[id]/publish/route.ts`
  - `app/api/catalog-items/[id]/unpublish/route.ts`
  - `app/api/catalog-items/bootstrap/route.ts`

### Sprint atual (WIP 1): Catálogo/Curadoria - 10 itens priorizados
1. Modelo canônico `Artwork` com estados `submitted|under_review|approved|rejected`: `PARCIAL`
  - `lib/artwork-store.ts`
2. Modelo canônico `CatalogItem` com estados `draft|ready|published|archived`: `PARCIAL`
  - `lib/catalog-item-store.ts`
3. API de submissão de arte com metadados mínimos e validação: `PARCIAL`
  - `app/api/artworks/route.ts` (`POST`)
4. Fila de curadoria com filtros por status/data/autor: `PARCIAL`
  - `app/api/artworks/route.ts` (`GET`)
5. Ação de aprovação de arte com `AuditLog`: `PARCIAL`
  - `app/api/artworks/[id]/approve/route.ts`
6. Ação de rejeição de arte com `reason` obrigatório e `AuditLog`: `PARCIAL`
  - `app/api/artworks/[id]/reject/route.ts`
7. Regra de bloqueio para impedir `CatalogItem published` quando arte `rejected`: `PARCIAL`
  - `app/api/catalog-items/[id]/publish/route.ts`
8. Vinculação arte aprovada -> produto base -> variantes: `PARCIAL`
  - `app/api/catalog-items/route.ts`
  - `lib/catalog-item-store.ts`
9. Publicação/despublicação com trilha (`publishedAt`, motivo e ator): `EXISTE`
  - `app/api/catalog-items/[id]/ready/route.ts`
  - `app/api/catalog-items/[id]/publish/route.ts`
  - `app/api/catalog-items/[id]/unpublish/route.ts`
  - `app/api/catalog-items/[id]/reopen/route.ts`
10. Substituir `getMockProduct` por leitura de `CatalogItem` publicado: `EXISTE`
  - estado atual:
    - `components/product/product-data.ts`
    - `app/product/[id]/page.tsx`

## 5) Suporte e Tickets
- DoD completo definido: `EXISTE` (documentação)
  - `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Implementação backend de tickets/triagem/escalonamento: `EXISTE` (MVP operacional validado com criação, resposta e contexto 360; SLA avançado permanece evolução)
  - `app/api/tickets/route.ts`
  - `app/api/tickets/[id]/route.ts`
  - `app/api/tickets/[id]/reply/route.ts`
  - `app/api/support/orders/[orderId]/context/route.ts`

## 6) Governança documental
- Precedência, fonte única, anti-conflito: `EXISTE`
  - `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Hierarquia de navegação: `EXISTE`
  - `docs/README_DOCS_HIERARCHY.md`
- Classificação normativo/referencial: `EXISTE`
  - `docs/DOCS_CLASSIFICATION.md`
- Template obrigatório de PR crítico: `EXISTE`
  - `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Histórico oficial de decisões: `EXISTE`
  - `docs/CHANGELOG_GOVERNANCE.md`

## 8) Base Enxuta Operacional (Fase 1)
- Modelo operacional/fiscal/financeiro unificado: `EXISTE`
  - `docs/MODELO_OPERACIONAL_FISCAL_FINANCEIRO.md`
- Termos base versionados (indústria/artista/consumidor): `EXISTE`
  - `docs/TERMO_INDUSTRIA_BASE.md`
  - `docs/TERMO_ARTISTA_BASE.md`
  - `docs/TERMO_CONSUMIDOR_BASE.md`
- Checklist de release de pagamentos reais: `EXISTE`
  - `docs/CHECKLIST_RELEASE_PAGAMENTOS.md`
- Entidades internas de suporte ao modelo (`payment_splits`, `license_events`, `terms_acceptances`): `EXISTE`
  - `lib/payment-split-store.ts`
  - `lib/license-event-store.ts`
  - `lib/terms-acceptance-store.ts`
- Entidades de integracao de provider (`provider_recipients`, `provider_webhook_events`, `integration_logs`): `EXISTE`
  - `lib/provider-recipient-store.ts`
  - `lib/provider-webhook-event-store.ts`
  - `lib/integration-log-store.ts`

## 7) Documentos externos citados e não presentes no repositório
- `docs/USERUAH_360_ARCHITECTURE.md`: `AUSENTE NO REPO`
- `docs/FRONT_BACK_FUNCTION_MAP.md`: `AUSENTE NO REPO`

## Conclusão operacional
Base de governança e jornada de produto/checkout está forte.
Próximo bloco de execução técnica para evolução real sem retrabalho:
1. Catálogo/Curadoria backend
2. Gateway real + persistência relacional de pagamento (fase 2.1)
3. Hardening de Pedidos/Logística (sair de store local para banco + observabilidade)
4. Hardening de Suporte/Tickets (SLA, escalonamento e trilha operacional completa)


---

## Bloco 2 - Ciclo Semanal Ativo

# Ciclo Semanal de Execucao (Catalogo/Curadoria)

Periodo: 2026-05-25 a 2026-05-29  
Dominio ativo (WIP 1): `catalogo-curadoria`  
Owner do ciclo: Produto + Backend  
Fonte operacional: `docs/EXECUTION_OPERATING_TEMPLATE.md`

## Objetivo da semana
Sair de catálogo mockado para base operacional mínima com estado, submissão, revisão e publicação controlada.

## Top 10 itens do ciclo (priorizados)

1. Contrato canônico `Artwork` no backend
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (modelo e persistencia local implementados)
- Entrega: tipo/interface + validação mínima de campos obrigatórios
- Critério de pronto: criação/consulta de `Artwork` válida com `status`, `authorId`, `metadata`, `submittedAt`

2. Contrato canônico `CatalogItem` no backend
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (modelo canônico + persistência local implementados)
- Entrega: tipo/interface + validação mínima de `variants` e `publicationStatus`
- Critério de pronto: item inválido bloqueado com `422 validation_error`

3. Endpoint de submissão de arte
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (`POST /api/artworks` implementado com validacao + AuditLog)
- Entrega: `POST` com validação de payload e criação em `submitted`
- Critério de pronto: payload inválido bloqueado; sucesso gera `AuditLog`

4. Endpoint de fila de curadoria com filtros
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (`GET /api/artworks` com filtros de status, autor e data)
- Entrega: listagem por `status`, `autor`, `data`
- Critério de pronto: filtro funcional e resposta consistente para curador

5. Ação de aprovação de arte com trilha
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (`POST /api/artworks/:id/approve` com validacao de transicao + AuditLog)
- Entrega: transição para `approved` com `AuditLog`
- Critério de pronto: transição inválida retorna `409 invalid_transition`

6. Ação de rejeição de arte com `reason` obrigatório
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (`POST /api/artworks/:id/reject` com `reason` obrigatorio + AuditLog)
- Entrega: transição para `rejected` exigindo motivo
- Critério de pronto: ausência de `reason` retorna `422`; sucesso gera `AuditLog`

7. Regra de bloqueio de publicação com arte rejeitada
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (bloqueio implementado no endpoint de publish)
- Entrega: impedir `CatalogItem published` quando `Artwork rejected`
- Critério de pronto: tentativa de publicação inválida retorna `409`

8. Vínculo `Artwork approved` -> `CatalogItem` -> variantes
- Status inicial: `AUSENTE`
- Status atual: `PARCIAL` (criação de catálogo exige artwork aprovado + variants)
- Entrega: regra de vínculo com integridade mínima
- Critério de pronto: sem `Artwork approved` não cria `CatalogItem` publicável

9. Publicação e despublicação com trilha
- Status inicial: `AUSENTE`
- Status atual: `EXISTE` (`ready/publish/unpublish/reopen` com trilha temporal e motivo)
- Entrega: ações de `publish/unpublish` com `publishedAt`, `reason`, `actor`
- Critério de pronto: histórico auditável por `catalogItemId`

10. Substituir `getMockProduct` por leitura de catálogo publicado
- Status inicial: `PARCIAL`
- Status atual: `EXISTE` (PDP lê apenas `CatalogItem published` e faz fallback `404`)
- Entrega: `/product/[id]` consumindo item publicado de fonte persistida
- Critério de pronto: PDP renderiza item publicado sem fallback em mock para item existente

Avanco adicional no ciclo:
- Shop e recomendacoes da PDP passaram a consumir `CatalogItem published` em vez de lista fixa.
- Endpoint de bootstrap criado para compatibilizar IDs legados (`1..6`) e evitar `404` no fluxo `shop -> product`.

## Gates obrigatórios da semana
- Gate de estado: alinhado a `docs/STATE_MACHINES.md`.
- Gate de contrato: alinhado a `docs/API_CONTRACTS.md`.
- Gate de segurança: RBAC + `AuditLog` em ações críticas.
- Gate de QA: testes P0 aplicáveis em `docs/QA_ACCEPTANCE_TESTS.md`.
- Gate de docs: atualizar `docs/EXECUTION_STATUS_MATRIX.md` na sexta.

## Evidências mínimas por item
- Endpoint testado (requisição/resposta)
- 1 caso de sucesso e 1 de erro por endpoint de mutação
- Registro de logs de auditoria para ações críticas

## Fechamento de sexta (2026-05-29)
- Atualizar status de cada item para `EXISTE|PARCIAL|AUSENTE`.
- Registrar decisões em `docs/CHANGELOG_GOVERNANCE.md` quando houver alteração de regra.
- Rodar reconciliação docs x código.

---

## Bloco 3 - Evidencias P0

# P0 Evidence Log

Data de revisao: 2026-05-19

## P0 â€” Order + Payment + Webhook Sandbox

Status: PASS  
Data: 2026-05-19  
Ambiente: local/dev  
Escopo: order + payment checkout + webhook sandbox

### Resultado
- P0-01 Criar pedido em `placed`: PASS
- P0-02 Checkout com idempotÃªncia: PASS
- P0-03 Bloquear checkout para order invÃ¡lida: PASS
- P0-04 Webhook approved: PASS
- P0-05 Webhook approved duplicado: PASS
- P0-06 Webhook failed: PASS
- P0-07 Assinatura invÃ¡lida: PASS
- P0-08 TransiÃ§Ã£o invÃ¡lida: PASS
- P0-09 ProduÃ§Ã£o sÃ³ apÃ³s `order.paid`: PASS
- P0-10 AuditLog crÃ­tico: PASS

### EvidÃªncias tÃ©cnicas
- `POST /api/orders` retornou `201` com `order.status = placed`.
- `POST /api/payments/checkout` com `x-idempotency-key` criou `payment.status = processing`.
- Webhook `approved` atualizou `payment -> approved`, `order -> paid` e criou `ProductionJob` em `queued`.
- Webhook duplicado retornou `already_processed`.
- Webhook `failed` manteve `order` em `placed` e nÃ£o criou produÃ§Ã£o.
- Assinatura invÃ¡lida retornou `401`.
- TransiÃ§Ã£o invÃ¡lida retornou `409 invalid_transition`.
- `production.created = 1`.
- `order.paid = 1`.

### Qualidade
- `npm run check`: PASS.
- `npm run build`: FAIL por encoding invÃ¡lido UTF-8 em arquivos legados fora do recorte.

### ObservaÃ§Ã£o
A persistÃªncia local via `dev-store.ts` Ã© recurso de desenvolvimento/teste e nÃ£o deve ser tratada como persistÃªncia final de produÃ§Ã£o.

## DÃ­vida tÃ©cnica aberta (P1)
Tema: corrigir arquivos legados com encoding invÃ¡lido UTF-8 que impedem `npm run build`.

CritÃ©rio de aceite:
- `npm run build` passa.
- Arquivos legados convertidos para UTF-8.
- Textos em portuguÃªs preservados sem mojibake.
- Nenhuma alteraÃ§Ã£o funcional colateral.

## P0 â€” Production Lifecycle (`queued -> in_production -> shipped`)

Status: PASS  
Data: 2026-05-19  
Ambiente: local/dev  
Escopo: lifecycle mÃ­nimo de produÃ§Ã£o sem `delivered`

### Resultado
- P0-PROD-01 Listar ProductionJob criado apÃ³s `order.paid`: PASS
- P0-PROD-02 Iniciar produÃ§Ã£o `queued -> in_production`: PASS
- P0-PROD-03 Bloquear start fora de `queued`: PASS (`409 invalid_transition`)
- P0-PROD-04 Bloquear ship direto de `queued`: PASS (`409 invalid_transition`)
- P0-PROD-05 Enviar produÃ§Ã£o `in_production -> shipped` com `trackingCode + carrier`: PASS
- P0-PROD-06 Criar Shipment exatamente 1 vez por order: PASS
- P0-PROD-07 Refletir `order -> shipped`: PASS
- P0-PROD-08 AuditLog de `production.started`, `production.shipped`, `shipment.created`, `order.shipped`: PASS
- P0-PROD-09 Ship duplicado nÃ£o duplica Shipment: PASS (`already_shipped`)
- P0-PROD-10 `npm run check`: PASS

### EvidÃªncias tÃ©cnicas
- `GET /api/production-jobs` retornou lista com job criado por fluxo pago.
- `GET /api/production-jobs/:id` retornou estado inicial `queued`.
- `POST /api/production-jobs/:id/start` atualizou para `in_progress` e `order` para `in_production`.
- Segunda tentativa de `start` retornou `409 invalid_transition`.
- `POST /api/production-jobs/:id/ship` (fora de estado) retornou `409 invalid_transition`.
- `POST /api/production-jobs/:id/ship` em `in_progress` gerou:
  - `ProductionJob.status = shipped`
  - `Shipment` criado com `trackingCode` e `carrier`
  - `Order.status = shipped`
- RepetiÃ§Ã£o de `ship` retornou `already_shipped` e manteve `shipmentId` estÃ¡vel.

### ReferÃªncias
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/QA_ACCEPTANCE_TESTS.md`

### ObservaÃ§Ã£o
Sem incluir `delivered` neste recorte, por depender de confirmaÃ§Ã£o logÃ­stica externa/manual.

## P0 — Order Status Visibility + Shipment Tracking

Status: PASS  
Escopo: consulta consolidada de status do pedido e rastreio por pedido  
Ambiente: local/dev  
Referências:
- `GET /api/orders/:orderId/status`
- `GET /api/shipments/:orderId`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-STATUS-01 — Pedido `placed`: PASS
- P0-STATUS-02 — Pedido `paid`: PASS
- P0-STATUS-03 — Pedido `in_production`: PASS
- P0-STATUS-04 — Pedido `shipped` com `trackingCode` + `carrier`: PASS
- P0-STATUS-05 — Acesso cruzado bloqueado com RBAC ativo: PASS
- P0-STATUS-06 — Suporte/admin consulta por `orderId`: PASS
- P0-STATUS-07 — Pedido inexistente retorna `404`: PASS
- P0-STATUS-08 — `npm run check`: PASS

### Evidências técnicas

- Endpoints `GET` não alteram estado.
- Pedido inexistente retorna `404`.
- Shipment inexistente para pedido existente retorna `200` com `shipment: null`.
- Cliente só consulta pedido próprio quando RBAC está ativo.
- Suporte/admin consulta pedido por `orderId`.
- Acesso cruzado retorna `403`.
- Pedido `shipped` retorna dados de rastreio.

### Observações

Este recorte fecha a visibilidade mínima do cliente e suporte sobre o ciclo operacional já validado: pedido, pagamento, produção e envio.

## P0 — Support 360 - Order Context

Status: PASS  
Escopo: contexto consolidado de suporte por pedido + fluxo minimo de tickets  
Ambiente: local/dev  
Referencias:
- `GET /api/support/orders/:orderId/context`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/reply`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-SUP-01 — support_agent consulta contexto completo por `orderId`: PASS
- P0-SUP-02 — Contexto inclui `order`, `payment`, `production`, `shipment`, `tickets`, `auditSummary`: PASS
- P0-SUP-03 — GET de contexto nao altera estado operacional: PASS
- P0-SUP-04 — customer cria ticket vinculado ao proprio pedido: PASS
- P0-SUP-05 — customer nao cria ticket para pedido de outro cliente: PASS
- P0-SUP-06 — support_agent responde ticket: PASS
- P0-SUP-07 — customer le proprio ticket e resposta: PASS
- P0-SUP-08 — customer nao le ticket de outro cliente: PASS
- P0-SUP-09 — pedido inexistente no contexto retorna `404`: PASS
- P0-SUP-10 — `npm run check`: PASS

### Evidencias tecnicas

- `GET /api/support/orders/:orderId/context` e estritamente leitura e nao cria/muta entidades.
- Endpoint de contexto bloqueia `customer` com `403`.
- `POST /api/tickets` so permite customer dono do pedido.
- `POST /api/tickets/:id/reply` evolui `open -> in_progress` na primeira resposta de suporte.
- Resposta de ticket nao altera estados de `order`, `payment`, `production` ou `shipment`.
- Pedido inexistente no contexto retorna `404`.

### Observacoes

Este recorte fecha diagnostico operacional minimo de suporte sem violar isolamento de dominios de order, payment, production e shipment.

## P0 — Commission Ledger + Payout Request

Status: PASS  
Escopo: ledger inicial de comissao + solicitacao de saque (`requested`)  
Ambiente: local/dev  
Referencias:
- `POST /api/payments/webhook`
- `GET /api/commissions/me`
- `POST /api/payouts`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-FIN-01 — `order.paid` cria CommissionLedger `pending`: PASS
- P0-FIN-02 — `commission.pending` nao pode ser sacada: PASS
- P0-FIN-03 — `commission.available` aparece em `GET /api/commissions/me`: PASS
- P0-FIN-04 — `customer` nao acessa ledger financeiro: PASS
- P0-FIN-05 — `artist/community_manager` acessam apenas proprio ledger: PASS
- P0-FIN-06 — `POST /api/payouts` cria `payout.requested` com saldo `available`: PASS
- P0-FIN-07 — payout acima do saldo retorna `409 insufficient_available_balance`: PASS
- P0-FIN-08 — `payout.requested` nao marca comissao como `paid`: PASS
- P0-FIN-09 — AuditLog registra `commission.created` e `payout.requested`: PASS
- P0-FIN-10 — `npm run check`: PASS

### Evidencias tecnicas

- Criacao de comissao idempotente por `order.paid:{orderId}`.
- Ledger separa saldo `pending`, `availableGross`, `requested`, `availableToWithdraw`.
- Disponibilidade e reconciliada sem mutar fluxo operacional de venda.
- `POST /api/payouts` exige `x-idempotency-key` e bloqueia saldo insuficiente.
- Solicitacao de saque nao executa pagamento nem marca comissao como `paid`.

### Observacoes

Este recorte inicia o dominio financeiro com separacao entre venda, comissao e saque, mantendo idempotencia, RBAC e trilha de auditoria.

## P0 - Catalog Lifecycle (`draft -> ready -> published -> archived -> draft`)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: ciclo operacional de publicacao e manutencao de `CatalogItem`

### Casos executados

- P0-CAT-01 - bootstrap de catalogo publicado: PASS
- P0-CAT-02 - publish idempotente em item ja publicado: PASS
- P0-CAT-03 - unpublish `published -> archived`: PASS
- P0-CAT-04 - reopen `archived -> draft`: PASS
- P0-CAT-05 - bloqueio `draft -> published` sem `ready`: PASS (`409`)
- P0-CAT-06 - ready `draft -> ready`: PASS
- P0-CAT-07 - publish `ready -> published`: PASS

### Evidencias tecnicas

- Execucao do script `scripts/qa-catalog-lifecycle.mjs` com `status: PASS`.
- Endpoint `POST /api/catalog-items/bootstrap` compatibilizou IDs legados e manteve fluxo `shop -> product`.
- Publicacao agora exige etapa intermediaria `ready`.
- Reabertura de item arquivado exige `reason`.

### Referencias

- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `scripts/qa-catalog-lifecycle.mjs`

## P0 - Payments 2.1 (sqlite + gateway_sandbox)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: persistencia relacional de pagamentos + adapter homologado de gateway sandbox

### Casos executados

- P0-PAY21-01 - order created: PASS
- P0-PAY21-02 - checkout processing via gateway_sandbox adapter: PASS
- P0-PAY21-03 - relational sqlite file created: PASS
- P0-PAY21-04 - payment status query ok: PASS
- P0-PAY21-05 - webhook approved processed: PASS
- P0-PAY21-06 - webhook duplicate handled: PASS

### Evidencias tecnicas

- Execucao do script `scripts/qa-payments-2-1.mjs` com `status: PASS`.
- Persistencia em `.tmp-store/payments.sqlite` criada e utilizada no fluxo de pagamento.
- Adapter `PAYMENT_PROVIDER=gateway_sandbox` utilizado no checkout sem quebra de contrato.
- Reprocessamento de webhook com mesmo `eventId` tratado sem duplicar efeito operacional.

### Referencias

- `lib/payment-store.ts`
- `lib/payment-provider.ts`
- `scripts/qa-payments-2-1.mjs`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`

## P0 - Payments status timeline events

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: trilha de eventos de pagamento no endpoint de status

### Casos executados

- P0-PAY21-EVT-01 - checkout grava evento `payment.checkout_started`: PASS
- P0-PAY21-EVT-02 - webhook approved grava evento `payment.approved`: PASS
- P0-PAY21-EVT-03 - `GET /api/payments/status/[paymentId]` retorna `events` ordenado: PASS
- P0-PAY21-EVT-04 - `npm run check`: PASS

### Evidencias tecnicas

- `lib/payment-service.ts` grava eventos em cada transicao relevante de status.
- `lib/payment-store.ts` persiste trilha em `payment_events` (sqlite) com fallback em store local.
- `app/api/payments/status/[paymentId]/route.ts` retorna `{ ok, payment, events }`.
- Execucao de `npm run qa:payments21` segue PASS apos o wiring de eventos.

### Referencias

- `lib/payment-service.ts`
- `lib/payment-store.ts`
- `app/api/payments/status/[paymentId]/route.ts`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`

## P0 - Webhook retry controlado + retencao operacional

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: robustez de processamento webhook sem alterar contrato

### Casos executados

- P0-PAY21-RET-01 - webhook com retry controlado por `PAYMENT_WEBHOOK_MAX_RETRIES`: PASS
- P0-PAY21-RET-02 - idempotencia de webhook com janela de retencao: PASS
- P0-PAY21-RET-03 - trilha de eventos com retencao automatica: PASS
- P0-PAY21-RET-04 - `npm run check` e `npm run qa:payments21`: PASS

### Evidencias tecnicas

- `app/api/payments/webhook/route.ts` aplica tentativas controladas para erros internos nao deterministas.
- `lib/webhook-event-store.ts` migrou para registro com `processedAt` + limpeza por `WEBHOOK_IDEMPOTENCY_RETENTION_DAYS`.
- `lib/payment-store.ts` aplica limpeza de `payment_events` por `PAYMENT_EVENTS_RETENTION_DAYS`.
- Contrato publico de API de pagamento permaneceu inalterado.

### Referencias

- `app/api/payments/webhook/route.ts`
- `lib/webhook-event-store.ts`
- `lib/payment-store.ts`
- `docs/ARCHITECTURE.md`
- `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`

## P0 - Payments adapter MySQL ativo (homologacao local)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev (Docker Desktop)  
Escopo: persistencia de pagamentos, eventos e idempotencia de webhook em MySQL

### Casos executados

- P0-PAY21-MY-01 - servidor iniciado com `PAYMENT_PERSISTENCE=mysql`: PASS
- P0-PAY21-MY-02 - checkout/status/webhook com `QA_BASE_URL=http://localhost:3211`: PASS
- P0-PAY21-MY-03 - idempotencia de webhook no backend MySQL: PASS
- P0-PAY21-MY-04 - persistencia validada no banco (`payments`, `payment_events`, `webhook_events`): PASS

### Evidencias tecnicas

- `npm run qa:payments21` com `QA_EXPECT_PERSISTENCE=mysql` retornou PASS.
- Query direta no container MySQL apos o fluxo:
  - `payments_count = 1`
  - `events_count = 2`
  - `webhook_count = 1`
- Contrato de API permaneceu inalterado.

### Referencias

- `lib/payment-store.ts`
- `lib/webhook-event-store.ts`
- `lib/payment-service.ts`
- `scripts/qa-payments-2-1.mjs`

## P0 - MySQL para Orders + Production + Shipments

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: adaptadores MySQL com fallback para dominio operacional de fulfilment

### Casos executados

- P0-MY-OPS-01 - `npm run typecheck` apos migracao async dos stores/rotas: PASS
- P0-MY-OPS-02 - `npm run check` apos migracao: PASS
- P0-MY-OPS-03 - schema de init MySQL atualizado com tabelas de operacao: PASS

### Evidencias tecnicas

- `lib/order-store.ts` migrado para async com suporte MySQL.
- `lib/production-store.ts` migrado para async com suporte MySQL.
- `lib/shipment-store.ts` migrado para async com suporte MySQL.
- Rotas que consomem esses dominios ajustadas para `await`.
- `infra/mysql/init/001_payments.sql` agora inclui `orders`, `production_jobs` e `shipments`.

### Referencias

- `lib/order-store.ts`
- `lib/production-store.ts`
- `lib/shipment-store.ts`
- `app/api/orders/[orderId]/status/route.ts`
- `app/api/production-jobs/[id]/start/route.ts`
- `app/api/production-jobs/[id]/ship/route.ts`
- `app/api/shipments/[orderId]/route.ts`
- `infra/mysql/init/001_payments.sql`

## P0 - MySQL para Tickets + Commissions + Payouts

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: suporte e financeiro migrados para adapter MySQL com fallback

### Casos executados

- P0-MY-SUPFIN-01 - stores migrados para async com suporte MySQL: PASS
- P0-MY-SUPFIN-02 - rotas ajustadas para `await` sem quebra de contrato: PASS
- P0-MY-SUPFIN-03 - `npm run typecheck`: PASS
- P0-MY-SUPFIN-04 - `npm run check`: PASS

### Evidencias tecnicas

- `lib/ticket-store.ts` com persistencia MySQL (`tickets`).
- `lib/commission-store.ts` com persistencia MySQL (`commissions`).
- `lib/payout-store.ts` com persistencia MySQL (`payouts`).
- `lib/payment-service.ts` atualizado para `createCommissionPending` async.
- `infra/mysql/init/001_payments.sql` atualizado com tabelas e indices de suporte/financeiro.

### Referencias

- `lib/ticket-store.ts`
- `lib/commission-store.ts`
- `lib/payout-store.ts`
- `app/api/tickets/route.ts`
- `app/api/tickets/[id]/route.ts`
- `app/api/tickets/[id]/reply/route.ts`
- `app/api/commissions/me/route.ts`
- `app/api/payouts/route.ts`
- `infra/mysql/init/001_payments.sql`

## P0 - Core Operations Cross-Domain (`order -> payment -> production -> shipment -> support`)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: fluxo operacional cruzado com RBAC em acoes de producao

### Casos executados

- P0-CORE-01 - bootstrap catalog ready: PASS
- P0-CORE-02 - production creation blocked for non-paid order: PASS
- P0-CORE-03 - paid order created via checkout+webhook: PASS
- P0-CORE-04 - production create idempotent for paid order: PASS
- P0-CORE-05 - production start protected by RBAC: PASS
- P0-CORE-06 - production start queued->in_progress: PASS
- P0-CORE-07 - production ship in_progress->shipped: PASS
- P0-CORE-08 - customer sees shipped order status: PASS
- P0-CORE-09 - shipment tracking available: PASS
- P0-CORE-10 - customer ticket opened: PASS
- P0-CORE-11 - support replied ticket: PASS
- P0-CORE-12 - support context consolidated: PASS

### Evidencias tecnicas

- `POST /api/production-jobs` implementado e validado com:
  - `409 invalid_transition` para `order.status != paid`
  - `201|200` controlado para criacao/idempotencia
- `POST /api/production-jobs/:id/start` e `POST /api/production-jobs/:id/ship` exigem actor de operacao com RBAC ativo.
- `GET /api/orders/:id/status` e `GET /api/shipments/:orderId` refletem estado final `shipped`.
- `POST /api/tickets` + `POST /api/tickets/:id/reply` + `GET /api/support/orders/:orderId/context` validados no mesmo fluxo.

### Referencias

- `scripts/qa-core-operations.mjs`
- `app/api/production-jobs/route.ts`
- `app/api/production-jobs/[id]/start/route.ts`
- `app/api/production-jobs/[id]/ship/route.ts`

## P0 - Base Enxuta Operacional (Fase 1)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: decomposicao financeira por item + license_events + terms_acceptances + gates opcionais

### Resultado
- P0-F1-01 `npm run alert:critical`: PASS
- P0-F1-02 `npm run check`: PASS
- P0-F1-03 Regressao de contratos publicos (`orders/payments/catalog`) sem quebra: PASS
- P0-F1-04 Persistencia interna de `payment_splits`: PASS
- P0-F1-05 Geracao interna de `license_events` em pagamento aprovado: PASS
- P0-F1-06 Gate de aceite de termos por feature flag: PASS

### Evidencias tecnicas
- Criadas tabelas internas: `terms_acceptances`, `payment_splits`, `license_events`.
- Criado endpoint `POST /api/terms/accept` para versionamento de aceite.
- `POST /api/catalog-items` pode exigir termo de industria (`TERMS_ENFORCE_INDUSTRY=true`).
- `POST /api/artworks` pode exigir termo de artista (`TERMS_ENFORCE_ARTIST=true`).
- `POST /api/orders` pode exigir termo de consumidor (`TERMS_ENFORCE_CONSUMER=true`).
- Webhook de pagamento aprovado registra split e evento de licenciamento sem mudar payload publico.

## P0 - Excecoes Criticas (cancel/refund/chargeback) + sincronizacao financeira

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: `order.cancel`, `refund`, `chargeback`, idempotencia e update de `payment_splits`/`license_events`

### Resultado
- P0-EXC-01 cancelamento valido em `placed`: PASS
- P0-EXC-02 bloqueio de cancelamento invalido por estado: PASS
- P0-EXC-03 abertura de refund (`requested`): PASS
- P0-EXC-04 idempotencia de refund por `x-idempotency-key`: PASS
- P0-EXC-05 aprovacao de refund (`requested -> approved`): PASS
- P0-EXC-06 bloqueio de rejeicao apos aprovacao: PASS
- P0-EXC-07 chargeback recebido: PASS
- P0-EXC-08 duplicidade de chargeback sem impacto duplicado: PASS
- P0-EXC-09 `payment_splits` atualizados para `refunded`: PASS
- P0-EXC-10 `license_events` atualizados em refund: PASS
- P0-EXC-11 `license_events` atualizados em chargeback: PASS

### Evidencias tecnicas
- Endpoints implementados:
  - `POST /api/orders/:orderId/cancel`
  - `POST /api/refunds`
  - `POST /api/refunds/:refundId/approve`
  - `POST /api/refunds/:refundId/reject`
  - `POST /api/chargebacks/webhook`
- Atualizacao financeira idempotente aplicada em:
  - `lib/payment-split-store.ts`
  - `lib/license-event-store.ts`
  - `lib/payment-exception-service.ts`
- Gates executados:
  - `npm run check`: PASS
  - `npm run qa:payments21`: PASS
  - `npm run qa:exceptions`: PASS
  - `npm run qa:coreops`: PASS

## P0 - Fechamento de Achados Altos (provider_recipients + provider_webhook_events + integration_logs)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: trilha de integracao de provider e mapeamento de recebedores sem quebra de contrato

### Resultado
- P0-HIGH-01 persistencia de webhook bruto por provider antes do processamento: PASS
- P0-HIGH-02 registro de logs de integracao (checkout/webhook): PASS
- P0-HIGH-03 mapeamento de recebedores de provider com fallback interno: PASS
- P0-HIGH-04 `npm run qa:full`: PASS

### Evidencias tecnicas
- Entidades adicionadas no schema runtime: `provider_recipients`, `provider_webhook_events`, `integration_logs`.
- `POST /api/payments/webhook` agora registra evento bruto, processa e marca resultado.
- `createPaymentWithIdempotency` registra trilha de integracao de `create_charge`.
- Split financeiro usa `provider_recipient_id` quando existir mapeamento para entidade.


