# Arquitetura Tecnica

Data de revisao: 2026-06-09

## Objetivo
Explicar como o sistema esta montado hoje, onde cada camada comeca e termina, e como um desenvolvedor deve seguir um fluxo sem adivinhar.

## Estado atual
- App Next.js usando App Router.
- Rotas visiveis e APIs convivem em `app/`.
- UI e composicao visual vivem em `components/`.
- Estado cliente compartilhado vive em `context/`.
- Hooks client-side reutilizaveis vivem em `hooks/`.
- Regra de negocio, stores, auth, RBAC e integracoes vivem em `lib/`.
- Automacao de QA, gates e readiness vivem em `scripts/`.
  - `scripts/qa/` concentra suites e runners
  - `scripts/release/` concentra cutover, preflight e go-live
  - `scripts/ops/` concentra alertas e rotinas operacionais
  - `scripts/gates/` concentra gates de PR
  - `scripts/catalog/` concentra reidratacao e geracao editorial
  - `scripts/lib/` concentra helpers compartilhados
- `tests/` fica reservado para testes canonicos de framework e nao substitui a trilha operacional em `scripts/qa/`
- O sistema usa persistencia hibrida:
  - store local/fallback em `lib/dev-store.ts`
  - adaptadores relacionais via `lib/mysql-runtime.ts`
  - pagamentos ainda suportam `sqlite` quando `PAYMENT_PERSISTENCE=sqlite`

## Camadas canonicas

### 1. Interface
- `app/**/page.tsx`
- `components/**`
- `components/admin/**`
- `components/operations/**`

Responsabilidade:
- renderizar pagina
- coletar input
- chamar API ou utilitario de aplicacao

Regra de leitura:
- `app/**` deve preferencialmente ficar fino como superficie de rota
- shells e telas administrativas exclusivas devem viver em `components/admin/**`
- telas operacionais compartilhadas entre namespaces devem viver em `components/operations/**`

Nao deve:
- duplicar regra de negocio
- decidir permissao critica so no client

### 2. Estado cliente e sessao de superficie
- `context/**`
- `hooks/**`

Responsabilidade:
- manter estado cliente compartilhado
- encapsular comportamento de DOM e browser
- orquestrar sessao de superficie consumida pela UI
- persistir apenas o que fizer sentido no navegador

Regra de leitura:
- `hooks/**` deve ficar focado em comportamento local e reutilizavel de UI
- `context/**` pode coordenar sessao, `localStorage` e chamadas para APIs ja existentes
- `context/**` nao deve virar fonte autoritativa de regra de negocio
- validacao real de permissao, transicao de estado e decisao critica continua no servidor e em `lib/**`

Exemplos atuais:
- `context/CartContext.tsx`
- `context/UserContext.tsx`
- `hooks/use-mobile.ts`
- `hooks/use-focus-trap.ts`

### 3. Aplicacao e dominio
- `app/api/**/route.ts`
- `lib/**/*`

Responsabilidade:
- validar entrada
- aplicar regra de negocio
- verificar ownership, role e transicao de estado
- persistir e montar resposta

Regra de leitura:
- rotas densas de administracao devem preferencialmente delegar para `lib/admin-api/**`
- `app/api/**/route.ts` deve tender a casca tecnica, nao a concentrador de fluxo inteiro
- `lib/**` ainda e a area mais larga do repositorio, entao a leitura correta deve seguir a taxonomia interna:
  - `*-store.ts` para persistencia e rastreabilidade
  - `*-service.ts` para orquestracao e regra
  - `*-provider.ts` para adaptacao externa
  - `admin-api/**` para handlers administrativos reutilizaveis
  - `role-matrix/**` e `role-routing/**` para matriz, escopo e navegacao por papel
  - `ui/**` para apoio visual sem concentrar JSX

### 4. Persistencia e integracoes
- `lib/*-store.ts`
- `lib/mysql-runtime.ts`
- `lib/payment-provider.ts`
- `lib/dimona-client.ts`

Responsabilidade:
- leitura e escrita
- adaptacao por provedor
- idempotencia, reconciliacao e rastreabilidade

Risco estrutural atual:
- `lib/**` ja esta funcional e navegavel, mas ainda depende de disciplina para nao virar deposito generico.
- a proxima organizacao tecnica deve priorizar subdominios internos de `lib/**`, nao criar novas raizes paralelas.

## Fluxos principais

### Catalogo e descoberta
1. UI em `app/shop/page.tsx` e `components/shop/ShopPageView.tsx`
2. dados de vitrine e leitura em `lib/shop-products.ts`
3. base de catalogo e moderacao em:
   - `lib/catalog-item-store.ts`
   - `lib/artwork-store.ts`
   - `lib/impact-review-store.ts`

### Pedido e checkout
1. `app/checkout/page.tsx`
2. `components/checkout/CheckoutPageView.tsx`
3. `app/api/orders/route.ts`
4. `lib/order-store.ts`
5. `lib/order-operational-view.ts`

### Pagamento
1. `app/api/payments/checkout/route.ts`
2. `lib/payment-service.ts`
3. `lib/payment-provider.ts`
4. `lib/payment-store.ts`
5. `app/api/payments/webhook/route.ts`
6. `lib/provider-webhook-event-store.ts`
7. `lib/payment-exception-service.ts`

Pontos que importam de verdade:
- `providerReference` e chave de reconciliacao
- webhook precisa suportar assinatura e idempotencia
- readiness final ainda depende da janela real de homologacao

### Producao, envio e suporte
1. pedido aprovado impacta:
   - `lib/production-store.ts`
   - `lib/shipment-store.ts`
2. leitura operacional:
   - `app/api/orders/[orderId]/status/route.ts`
   - `app/api/support/orders/[orderId]/context/route.ts`
3. suporte:
   - `app/api/tickets/route.ts`
   - `app/api/tickets/[id]/reply/route.ts`
   - `lib/ticket-store.ts`

### Campanhas e impactos de Fase 2
1. `app/community/campaigns/page.tsx`
2. `app/api/campaigns/**`
3. `lib/campaign-store.ts`

Regra de leitura:
- tratar `MovementCampaign` como capacidade parcial real
- nao presumir `Organization`, `CampaignProduct`, `Referral*` e `/@username` como dominio fechado

## Persistencia

### Modo local/fallback
- varios stores usam `lib/dev-store.ts`
- util para desenvolvimento, prototipagem e trilhas ainda nao migradas

### Modo relacional
- varios stores ja suportam MySQL por `lib/mysql-runtime.ts`
- `PAYMENT_PERSISTENCE` controla parte relevante da comutacao

### Pagamentos
- `lib/payment-store.ts` suporta `sqlite` e `mysql`
- `infra/mysql/init/001_payments.sql` prepara a base relacional inicial
- QA de cutover e readiness operacional vivem em `scripts/release/p3-cutover-evidence.mjs` e correlatos

## Autenticacao, sessao e RBAC
- auth local e cadastro:
  - `lib/auth-local-users.ts`
  - `lib/auth-session.ts`
  - `lib/session-token.ts`
- escopo e acesso:
  - `lib/access-control.ts`
  - `lib/role-routing/access-routing.ts`
  - `lib/role-scope.ts`
- matrizes:
  - `lib/role-matrix/permission-matrix.ts`
  - `lib/role-matrix/registration-matrix.ts`

Regra de projeto:
- permissao real deve ser validada no servidor
- guard de tela ajuda UX, mas nao substitui verificacao em API

## Assets e conteudo
- assets publicos de marca em `public/brand/`
- assets editoriais e canonicos do catalogo em `public/assets/editorial/catalog/`
- tokens e mensagens em `data/`
- parametros operacionais versionados em `config/`
- `metadata.json` na raiz deve ser tratado como manifesto de tooling externo, nao como config interna do produto

## QA e gates
- gates estaticos:
  - `npm run check`
  - `npm run check:strict`
- QA por dominio:
  - `qa:catalog`
  - `qa:payments21`
  - `qa:coreops`
  - `qa:campaign:impact`
- readiness e producao controlada:
  - `go:e2e:proof`
  - `p3:precheck`
  - `go:preflight`

Regra de fronteira:
- `scripts/qa/**` para suites que dependem de servidor rodando, `QA_PORT`, `QA_BASE_URL`, bootstrap ou evidencias operacionais
- `tests/**` para testes locais de framework, unitarios ou integracoes desacopladas de operacao

## Regras estruturais
- nova rota entra em `app/` e precisa ser refletida em `docs/CODEBASE_MAP.md`
- regra de negocio nova entra em `lib/`, nao em `components/`
- estado cliente compartilhado entra em `context/` apenas se atravessar telas ou shells
- hook novo entra em `hooks/` apenas se resolver comportamento client-side reutilizavel
- se `context/**` ou `hooks/**` comecarem a decidir regra critica, a mudanca esta na camada errada
- store novo precisa explicitar se usa `dev-store`, `sqlite`, `mysql` ou estrategia hibrida
- mudanca de contrato ou fluxo critico exige atualizar:
  - `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` se alterar estado real por fase
  - `docs/CODEBASE_MAP.md` se alterar localizacao
  - `docs/CHANGELOG_GOVERNANCE.md` se houver decisao relevante

## O que nao presumir
- readiness local como equivalente de homologacao final
- Fase 2 como base madura completa
- documentacao de fase como prova de runtime sem confirmar na matriz e no codigo
