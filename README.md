# Loja UseRuah

Aplicacao Next.js da loja UseRuah com foco em catalogo, checkout, pagamentos, pedidos, operacao e suporte.

## Leitura honesta do estado atual
- Fase 1 funcional: fechada no runtime atual.
- Fase 1 producao: ainda depende da homologacao final real.
- Fase 2: existe, mas so com base parcial comprovada em `MovementCampaign`.
- Fase 3: bloqueada.

Esse repositorio ja tem bastante capacidade implementada. O problema principal nao e falta de codigo; e falta de navegacao rapida para entender onde cada responsabilidade vive.

## Start Here
Leia nesta ordem antes de mexer em algo importante:
1. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
2. `docs/EXECUTION_OPERATING_TEMPLATE.md`
3. `docs/ARCHITECTURE.md`
4. `docs/CODEBASE_MAP.md`
5. documento de dominio que autoriza a mudanca

## Estrutura do repositorio

### Pastas principais
- `app/`
  - rotas Next.js App Router
  - paginas visiveis em `app/**/page.tsx`
  - APIs em `app/api/**/route.ts`
- `components/`
  - UI e composicao visual por dominio
  - sem persistencia e sem regra de negocio central
  - telas administrativas agora ficam em `components/admin/**`
- `lib/`
  - regras de negocio, stores, auth, RBAC, integracoes e adaptadores
  - aqui vive a maior parte da verdade tecnica do sistema
- `scripts/`
  - automacao operacional organizada por responsabilidade
  - `scripts/qa/` para suites e runners
  - `scripts/release/` para preflight, cutover e go-live
  - `scripts/ops/` para alertas, reconciliacao e janelas
  - `scripts/catalog/` para seeds e geracao editorial
  - `scripts/gates/` para gates de PR e impacto
  - `scripts/lib/` para helpers compartilhados
- `docs/`
  - decisao, escopo, readiness, handoff e referencia tecnica
- `data/`
  - tokens, mensagens, seeds e configuracoes sem codigo executavel
- `config/`
  - configuracoes operacionais versionadas
- `infra/`
  - bootstrap de infraestrutura local, especialmente MySQL
- `public/`
  - assets publicos de marca, editorial e catalogo

### Regras praticas de localizacao
- quer entender rota de tela: comece em `app/**/page.tsx`
- quer entender endpoint: comece em `app/api/**/route.ts`
- quer entender regra de negocio: siga para `lib/**`
- quer entender persistencia: procure `*-store.ts` em `lib/`
- quer entender impacto operacional: procure scripts `qa:*`, `go:*`, `p3:*`
- quer entender a arvore de automacao: leia `scripts/README.md`

## Como o sistema funciona por camada

### 1. Interface e rotas
- paginas em `app/`
- composicao visual em `components/`
- superficies administrativas em `components/admin/**`
- guards de namespace e dashboard por papel:
  - `components/routing/RoleNamespaceGuard.tsx`
  - `components/routing/RoleDashboardPage.tsx`

### 2. Aplicacao e dominio
- pedidos: `lib/order-store.ts`, `lib/order-operational-view.ts`
- pagamentos: `lib/payment-service.ts`, `lib/payment-store.ts`, `lib/payment-provider.ts`
- suporte: `lib/ticket-store.ts`
- campanhas: `lib/campaign-store.ts`
- catalogo: `lib/catalog-item-store.ts`, `lib/artwork-store.ts`
- producao e envio: `lib/production-store.ts`, `lib/shipment-store.ts`

### 3. Persistencia
- fallback/local store em `lib/dev-store.ts`
- adaptador relacional em `lib/mysql-runtime.ts`
- varios stores funcionam em modo hibrido, comutando por `PAYMENT_PERSISTENCE`

### 4. Autenticacao e autorizacao
- login e sessao: `lib/auth-local-users.ts`, `lib/auth-session.ts`, `lib/session-token.ts`
- regras de acesso: `lib/access-control.ts`, `lib/role-scope.ts`
- matriz de permissoes e cadastro:
  - `lib/role-matrix/permission-matrix.ts`
  - `lib/role-matrix/registration-matrix.ts`

## Fluxos principais para onboarding

### Catalogo
1. `app/shop/page.tsx`
2. `components/shop/ShopPageView.tsx`
3. `lib/shop-products.ts`
4. `lib/catalog-item-store.ts`

### Pedido e checkout
1. `app/checkout/page.tsx`
2. `components/checkout/CheckoutPageView.tsx`
3. `app/api/orders/route.ts`
4. `lib/order-store.ts`

### Pagamento e webhook
1. `app/api/payments/checkout/route.ts`
2. `lib/payment-service.ts`
3. `lib/payment-provider.ts`
4. `lib/payment-store.ts`
5. `app/api/payments/webhook/route.ts`
6. `lib/provider-webhook-event-store.ts`

### Suporte
1. `app/account/support/page.tsx`
2. `app/api/tickets/route.ts`
3. `app/api/tickets/[id]/reply/route.ts`
4. `lib/ticket-store.ts`

### Campanhas
1. `app/community/campaigns/page.tsx`
2. `app/api/campaigns/route.ts`
3. `lib/campaign-store.ts`

## Comandos principais

### Desenvolvimento
- `npm install`
- copie `.env.example` para `.env.local` ou `.env`
- `npm run dev`

### Qualidade estatica
- `npm run check`
- `npm run check:strict`
- `npm run build`

### QA funcional e operacional
- `npm run qa:functional`
- `npm run qa:catalog`
- `npm run qa:payments21`
- `npm run qa:coreops`
- `npm run qa:campaign:impact`
- `npm run qa:full`

### Readiness e producao controlada
- `npm run go:e2e:proof`
- `npm run go:e2e:proof:run`
- `npm run p3:precheck`
- `npm run go:preflight`

## Regras para criar ou mover arquivos
- nao criar pasta nova sem uma responsabilidade clara e recorrente
- nao duplicar regra de negocio em `components/`
- regra de negocio fica em `lib/`
- endpoint novo exige atualizacao de `docs/CODEBASE_MAP.md`
- mudanca estrutural exige revisao de `docs/ARCHITECTURE.md`
- mudanca relevante exige registro em `docs/CHANGELOG_GOVERNANCE.md`

## Documentos que um desenvolvedor realmente usa
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
  - estado real por fase e dominio
- `docs/EXECUTION_OPERATING_TEMPLATE.md`
  - trava pre-patch
- `docs/ARCHITECTURE.md`
  - como o sistema esta montado
- `docs/CODEBASE_MAP.md`
  - onde cada coisa vive
- `docs/README_DOCS_HIERARCHY.md`
  - qual documento consultar em cada tipo de decisao

## Observacoes operacionais
- `HML_BASE_URL=http://localhost:3000` em ambiente local nao equivale a homologacao final real.
- readiness local nao deve ser confundido com aceite final de producao.
- `@/*` e o alias padrao do projeto definido em `tsconfig.json`.
