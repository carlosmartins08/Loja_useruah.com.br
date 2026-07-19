# Arquitetura Tecnica

Data de revisao: 2026-07-19

## Objetivo
Explicar como o sistema esta montado hoje, onde cada camada comeca e termina, e como um desenvolvedor deve seguir um fluxo sem adivinhar.

## Decisao arquitetural oficial
- A UseRuah e uma aplicacao **Next.js full-stack** usando App Router.
- `app/**/page.tsx`, layouts e Server Components formam a camada de interface.
- `app/api/**/route.ts` forma a API/backend HTTP da propria aplicacao.
- `lib/**` concentra dominio, aplicacao, autenticacao, RBAC, persistencia e integracoes.
- Nao existe backend HTTP paralelo em Express, Nest ou outro framework.
- Jobs operacionais, QA e release continuam em `scripts/**`, fora do caminho sincrono de requisicao.

Essa decisao define a fronteira da aplicacao. Ela nao autoriza misturar fontes de dados: cada ambiente deve declarar seu adapter de persistencia e seu grau de maturidade por dominio.

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
- O runtime oficial do produto usa MySQL quando `PAYMENT_PERSISTENCE=mysql`.
- O MySQL e a fonte de verdade para os stores relacionais que ja possuem adapter.
- `lib/dev-store.ts` e o SQLite ficam restritos a desenvolvimento, seeds ou QA explicitamente configurado.
- Quando MySQL esta configurado, falha de conexao ou schema nao pode cair silenciosamente para JSON.
- Alguns dominios ainda possuem apenas persistencia local; eles devem ser tratados como capacidades parciais, nao como base de producao completa.

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

Politica por ambiente:
- desenvolvimento local integrado: MySQL Docker como fonte oficial do app;
- QA isolado: store local ou SQLite apenas quando a suite declarar esse modo;
- homologacao e producao: MySQL gerenciado, sem fallback para arquivo local;
- seeds, fixtures e dados efemeros: nunca tratados como persistencia oficial.

### Migrações e backfill
- `infra/mysql/init/001_payments.sql` é o baseline de bootstrap local.
- `infra/mysql/migrations/002_distribution_authority.sql` formaliza as tabelas de distribuição e referral.
- `schema_migrations` registra versão, nome, checksum e data de aplicação.
- `npm run db:migrate:mysql` é o caminho operacional para aplicar migrações; `npm run db:migrate:mysql:plan` permite inspeção sem conexão.
- `npm run db:backfill:authority` faz plano sem escrita. A execução exige `--execute` e um ou mais `--allow-prefix=...`.
- O `.tmp-store` atual é fonte de dados legada mista; não pode ser importado integralmente como se fosse verdade histórica.
- `npm run db:readiness:mysql` valida tabelas, migrações e bloqueia HML/produção sem URL externa real.

Risco estrutural atual:
- Atualização W6: campanhas, campaign products e referral já possuem adapters MySQL e migração versionada. O backfill histórico segue escopado e não foi promovido automaticamente; artwork e impact-review ainda dependem de backfill e prova externa.
- `lib/**` ja esta funcional e navegavel, mas ainda depende de disciplina para nao virar deposito generico.
- alguns stores de campanhas e referral continuam locais e precisam ser promovidos ou explicitamente mantidos fora do escopo de produção; `artwork` e `impact-review` já têm adapter MySQL, mas ainda não possuem migração versionada/backfill formal.
- a proxima organizacao tecnica deve priorizar subdominios internos de `lib/**`, nao criar novas raizes paralelas.

## Fluxos principais

### Catalogo e descoberta
1. UI em `app/shop/page.tsx` e `components/shop/ShopPageView.tsx`
2. dados de vitrine e leitura em `lib/shop-products.ts`
3. base de catalogo e moderacao em:
   - `lib/catalog-item-store.ts`
   - `lib/artwork-store.ts`
   - `lib/impact-review-store.ts`
4. quando `PAYMENT_PERSISTENCE=mysql`, `catalog_items` e a autoridade única de nome, preço, mídia, variantes, categoria, segmento, tags e estado de publicação; `lib/brand-assets.ts` só fornece seeds/editorial e metadata ainda não modelada
5. `artworks` e `impact_reviews` preservam as decisões editoriais e operacionais da cadeia sem depender do processo atual

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
4. `lib/campaign-product-store.ts`
5. `lib/campaign-public.ts` e `lib/shop-products.ts`

Regra de leitura:
- tratar `MovementCampaign` como capacidade parcial real
- `Campaign` e `CampaignProduct` são autoridade relacional no MySQL quando `PAYMENT_PERSISTENCE=mysql`
- produto, preço, mídia, variantes e publicação continuam vindo de `CatalogItem`; campanha guarda somente o vínculo e o contexto de distribuição
- não presumir `Organization`, `Referral*` e `/@username` como domínio fechado

## Persistencia

### Modo local explícito
- vários stores ainda usam `lib/dev-store.ts`
- útil para desenvolvimento, prototipagem e trilhas ainda não migradas
- não é fallback permitido quando `PAYMENT_PERSISTENCE=mysql`

### Modo relacional
- varios stores ja suportam MySQL por `lib/mysql-runtime.ts`
- `PAYMENT_PERSISTENCE` controla parte relevante da comutacao
- o `catalog-item-store` não serve `.tmp-store` após falha ou ausência de registro no MySQL
- `artwork-store` e `impact-review-store` seguem a mesma regra, sem fallback local em MySQL
- `campaign-store` e `campaign-product-store` seguem a mesma regra, sem fallback local em MySQL
- `referral-store` segue a mesma regra, com `referral_links` para links e `referral_events` para cliques/conversões

### Pagamentos
- `lib/payment-store.ts` suporta `sqlite` e `mysql`
- `infra/mysql/init/001_payments.sql` prepara a base relacional inicial
- QA de cutover e readiness operacional vivem em `scripts/release/p3-cutover-evidence.mjs` e correlatos

## Autenticacao, sessao e RBAC
- auth local e cadastro:
  - `lib/user-identity-store.ts` como autoridade de identidade
  - `infra/mysql/init/001_payments.sql` com as tabelas `users` e `registrations`
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
- em `PAYMENT_PERSISTENCE=mysql`, identidade e cadastro usam MySQL; falha de persistencia responde indisponibilidade, sem fallback silencioso
- usuarios demo e JSON local existem apenas para desenvolvimento/QA explicitamente configurado
- o cookie `ruah_session` continua sendo o contrato de sessao; a persistencia duravel passa a ser a autoridade de identidade, nao o token isolado

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
