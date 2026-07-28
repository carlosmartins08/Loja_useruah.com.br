# Loja UseRuah

Aplicacao Next.js da loja UseRuah com foco em catalogo, checkout, pagamentos, pedidos, operacao e suporte.

Arquitetura oficial: Next.js full-stack com App Router. As telas vivem em `app/**`, o backend HTTP vive em `app/api/**`, e dominio, RBAC, persistencia e integracoes vivem em `lib/**`. Nao existe backend HTTP separado para os dominios atuais.

Nos ambientes integrados, MySQL e a fonte oficial dos stores relacionais. JSON/SQLite sao recursos de desenvolvimento, seed ou QA explicitamente configurado; nao devem funcionar como fallback silencioso em homologacao ou producao.

## Leitura honesta do estado atual
- Fase 1 funcional: fechada no runtime atual.
- Fase 1 producao: ainda depende da homologacao final real.
- Fase 2: existe, mas so com base parcial comprovada em `MovementCampaign`.
- Fase 3: bloqueada.

Esse repositorio ja tem bastante capacidade implementada. O problema principal nao e falta de codigo; e falta de navegacao rapida para entender onde cada responsabilidade vive.

## Start Here
Antes de mexer em algo importante:
1. `CONTRIBUTING.md` para escolher a trilha pela missao, preparar a branch e entender o fluxo de revisao.
2. `docs/README_DOCS_HIERARCHY.md` e `docs/DOCS_CLASSIFICATION.md` para saber quais fontes prevalecem.
3. `docs/ACTIVE_FRONT.md` e `docs/NEXT_SESSION_TRIGGER.md` quando o trabalho for continuidade serial ou frente ativa.
4. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`, `docs/ARCHITECTURE.md` e `docs/CODEBASE_MAP.md` para estado real, fronteiras e localizacao tecnica.
5. documento de dominio que autoriza a mudanca.

## Estrutura do repositorio

### Pastas principais
- `app/`
  - rotas Next.js App Router
  - paginas visiveis em `app/**/page.tsx`
  - APIs em `app/api/**/route.ts`
- `components/`
  - UI e composicao visual por dominio
  - sem persistencia e sem regra de negocio central
  - `components/admin/**` para shells e telas exclusivas do namespace administrativo
  - `components/operations/**` para telas operacionais compartilhadas entre mais de um namespace
- `context/`
  - estado cliente compartilhado entre telas
  - pode orquestrar sessao e persistencia local de navegador
  - nao deve virar fonte primaria de regra de negocio
- `hooks/`
  - hooks client-side reutilizaveis
  - foco em comportamento de UI, DOM, acessibilidade e estado derivado de superficie
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
- `tests/`
  - reservado para testes canonicos de framework e asserts locais
  - nao e a trilha oficial de QA operacional do projeto hoje
- `docs/`
  - decisao, escopo, readiness, handoff e referencia tecnica
  - `docs/archive/` guarda material retirado da camada ativa de consulta
- `artifacts/`
  - saidas locais geradas por QA, screenshots e evidencias temporarias
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
- quer entender estado cliente compartilhado: leia `context/README.md`
- quer entender hook reutilizavel de UI: leia `hooks/README.md`
- quer entender regra de negocio: siga para `lib/**`
- quer entender persistencia: procure `*-store.ts` em `lib/`
- quer decidir entre regra cliente e regra de dominio: leia `lib/README.md`, `context/README.md` e `hooks/README.md`
- quer entender impacto operacional: procure scripts `qa:*`, `go:*`, `p3:*`
- quer entender a arvore de automacao: leia `scripts/README.md`
- quer decidir entre teste de framework e QA operacional: leia `tests/README.md`
- quer decidir entre dado versionado e parametro operacional: leia `data/README.md` e `config/README.md`
- quer saber se um documento ainda manda em algo: leia `docs/README_DOCS_HIERARCHY.md` e `docs/DOCS_CLASSIFICATION.md`

## Como o sistema funciona por camada

### 1. Interface e rotas
- paginas em `app/`
- composicao visual em `components/`
- superficies administrativas exclusivas em `components/admin/**`
- superficies operacionais compartilhadas em `components/operations/**`
- guards de namespace e dashboard por papel:
  - `components/routing/RoleNamespaceGuard.tsx`
  - `components/routing/RoleDashboardPage.tsx`

### 2. Estado cliente e sessao de superficie
- estado cliente compartilhado em `context/`
- hooks reutilizaveis em `hooks/`
- exemplos:
  - `context/CartContext.tsx`
  - `context/UserContext.tsx`
  - `hooks/use-mobile.ts`
  - `hooks/use-focus-trap.ts`

Regra curta:
- `hooks/**` resolve comportamento local de UI e DOM
- `context/**` coordena estado cliente compartilhado, sessao de superficie e persistencia local
- nem `hooks/**` nem `context/**` devem carregar a regra de negocio autoritativa do sistema

### 3. Aplicacao e dominio
- pedidos: `lib/order-store.ts`, `lib/order-operational-view.ts`
- pagamentos: `lib/payment-service.ts`, `lib/payment-store.ts`, `lib/payment-provider.ts`
- suporte: `lib/ticket-store.ts`
- campanhas: `lib/campaign-store.ts`
- catalogo: `lib/catalog-item-store.ts`, `lib/artwork-store.ts`
- producao e envio: `lib/production-store.ts`, `lib/shipment-store.ts`

Taxonomia rapida de `lib/`:
- `*-store.ts`: persistencia, leitura e escrita
- `*-service.ts`: orquestracao e regra de negocio
- `*-provider.ts`: integracao externa ou adaptacao por provedor
- `admin-api/**`: handlers reutilizaveis para rotas administrativas
- `role-matrix/**` e `role-routing/**`: RBAC, escopo e navegacao por papel
- `ui/**`: constantes e utilitarios de suporte visual sem virar componente

### 4. Persistencia
- fallback/local store em `lib/dev-store.ts`
- adaptador relacional em `lib/mysql-runtime.ts`
- varios stores funcionam em modo hibrido, comutando por `PAYMENT_PERSISTENCE`

### 5. Autenticacao e autorizacao
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
5. `context/CartContext.tsx`

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

### Regra de testes
- `scripts/qa/**` continua sendo a trilha oficial para QA operacional e suites dependentes de ambiente
- `tests/**` fica reservado para testes de framework quando a cobertura nascer como unit, integracao local ou spec desacoplada de runtime operacional

### Readiness e producao controlada
- `npm run go:e2e:proof`
- `npm run go:e2e:proof:run`
- `npm run p3:precheck`
- `npm run go:preflight`

## Regras para criar ou mover arquivos
- nao criar pasta nova sem uma responsabilidade clara e recorrente
- nao duplicar regra de negocio em `components/`
- regra de negocio fica em `lib/`
- tela exclusiva de `/admin/**` deve preferir `components/admin/**`
- tela operacional reutilizada por mais de um namespace deve preferir `components/operations/**`
- endpoint novo exige atualizacao de `docs/CODEBASE_MAP.md`
- mudanca estrutural exige revisao de `docs/ARCHITECTURE.md`
- mudanca relevante exige registro em `docs/CHANGELOG_GOVERNANCE.md`

## Politica da raiz

### O que pode viver na raiz
- arquivos canonicos de projeto e build:
  - `package.json`
  - `package-lock.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `postcss.config.mjs`
  - `eslint.config.mjs`
  - `next-env.d.ts`
- arquivos de ambiente e repositorio:
  - `.env.example`
  - `.gitignore`
  - `.gitattributes`
  - `docker-compose.yml`
  - `README.md`
  - `CONTRIBUTING.md`
- manifestos de tooling que precisem ficar na raiz por contrato externo:
  - `metadata.json`
    - tratar como manifesto externo de tooling, nao como fonte de config interna do produto

### O que nao deve viver na raiz
- logs locais
- screenshots temporarios
- relatorios de QA
- dumps operacionais
- arquivos `tmp`
- configuracao duplicada quando ja existir uma fonte atual

### Destino correto
- evidencias e screenshots: `artifacts/**`
- automacao: `scripts/**`
- referencia versionada: `docs/**`
- runtime/publico: `public/**`
- dado versionado: `data/**`
- parametro operacional versionado: `config/**`

### Regra de manutencao
- se um arquivo novo nao pertence claramente a uma das categorias acima, ele nao deve nascer na raiz
- antes de adicionar algo na raiz, a pergunta correta e: isso e fonte canonica do repositorio ou apenas saida/local tooling?

## Documentos que um desenvolvedor realmente usa
- `CONTRIBUTING.md`
  - entrada por missao, fluxo de branch, validacao e revisao
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
- `docs/DOCS_CLASSIFICATION.md`
  - o que e normativo, referencial, redirecionador legado ou arquivo morto
- `artifacts/README.md`
  - onde colocar saida gerada e o que nao deve poluir a raiz
- `data/README.md`
  - quando usar `data/**`
- `config/README.md`
  - quando usar `config/**`

## Observacoes operacionais
- `HML_BASE_URL=http://localhost:3000` em ambiente local nao equivale a homologacao final real.
- readiness local nao deve ser confundido com aceite final de producao.
- `@/*` e o alias padrao do projeto definido em `tsconfig.json`.
