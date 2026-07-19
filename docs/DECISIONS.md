# Decisions

## 2026-07-19 - Promoção externa depende de manifesto verificável

### Contexto
- O backfill legado não possui origem comercial comprovada e não pode ser promovido por inferência.
- A execução futura precisa separar validação de manifesto, readiness externo, plano, aprovação e escrita.

### Decisão
- Exigir manifesto com snapshot, checksum, origem, destino, escopo sem curingas, backup e rollback.
- Bloquear URL local, checksum placeholder, campos ausentes e segredo de banco ausente.
- Não imprimir valores de conexão e não conectar ao banco antes do preflight passar.

### Consequência prática
- A promoção externa agora tem uma entrada operacional única e auditável.
- O template não representa aprovação; é apenas estrutura para preenchimento por responsável autorizado.

## 2026-07-19 - Nenhum backfill legado aprovado sem origem comprovada

### Contexto
- A auditoria técnica encontrou 106 campanhas, 47 vínculos, 32 links e 46 eventos com sinais de QA/teste.
- Não houve órfãos, duplicidades ou conflitos com MySQL, mas todos os registros estão ausentes do banco relacional e não possuem metadado confiável de ambiente.

### Decisão
- Não aprovar nenhum prefixo ou ID para backfill nesta rodada.
- Exigir fonte comercial identificável ou classificação humana formal antes de executar `--execute`.
- Tratar ausência de conflito como evidência de consistência estrutural, não como prova de legitimidade comercial.

### Consequência prática
- O gate de backfill permanece seguro e reutilizável.
- A próxima ação depende de snapshot real de HML/produção ou decisão explícita sobre os dados legados.

## 2026-07-19 - Migração versionada e backfill com escopo explícito

### Contexto
- A autoridade MySQL de campanhas e referral já estava provada no runtime, mas o DDL ainda estava misturado ao bootstrap e o `.tmp-store` continha dados heterogêneos.
- Importar o JSON inteiro poderia promover seeds, QA e histórico sem classificação para um ambiente integrado.

### Decisão
- Manter `001_payments.sql` como baseline e aplicar `002_distribution_authority.sql` como migração formal para campanhas e referral.
- Registrar versões e SHA-256 em `schema_migrations`; checksum divergente bloqueia a execução.
- Fazer backfill apenas em modo plano por padrão. Execução exige `--execute` e prefixos explícitos de escopo.
- Bloquear readiness de HML/produção quando não houver base externa real.

### Consequência prática
- Migração é reproduzível e idempotente no ambiente local.
- Nenhum backfill histórico é considerado concluído nesta rodada; os dados JSON precisam ser classificados antes da promoção.
- O mecanismo está pronto, mas a prova externa continua pendente.

## 2026-07-19 - ReferralLink e eventos com autoridade relacional

### Contexto
- Referral ainda persistia em JSON, embora o redirect público, o workspace de afiliado e o fluxo de pagamento dependessem dos mesmos links e eventos.
- Um restart podia apagar clique/conversão ou permitir divergência entre atribuição pública e painel.

### Decisão
- Promover `ReferralLink` e `ReferralEvent` para `referral_links` e `referral_events` no MySQL quando `PAYMENT_PERSISTENCE=mysql`.
- Manter eventos separados da entidade do link e preservar conversão idempotente por pedido.
- Preservar os endpoints e o contrato de `reused=true`; não criar rota V2 nem alterar o modelo de pedido nesta rodada.

### Consequência prática
- Redirect, workspace, checkout e webhook passam a compartilhar autoridade durável.
- A prova está registrada em `artifacts/audits/2026-07-19-w5-referral-authority.md`; HML/produção ainda exigem prova própria.

## 2026-07-18 - Campaign e CampaignProduct com autoridade relacional de distribuição

### Contexto
- Campanhas e vínculos de produto ainda eram lidos e escritos apenas em JSON, embora a vitrine pública e o checkout já dependessem deles.
- Isso permitia que o backoffice, a vitrine e o processo reiniciado enxergassem estados diferentes.

### Decisão
- Promover `Campaign` e `CampaignProduct` para adapters assíncronos com MySQL como fonte oficial quando `PAYMENT_PERSISTENCE=mysql`.
- Manter JSON somente em modo local/QA explicitamente declarado, sem fallback silencioso.
- Não duplicar dados de catálogo no vínculo; `CatalogItem` continua dono de produto, preço, mídia, variantes e publicação.
- Preservar a relação única por campanha e item e manter referral/financeiro fora desta rodada.

### Consequência prática
- A campanha ativa e seus produtos publicados permanecem coerentes entre API, detalhe operacional, PDP, checkout e storefront após reinício.
- A prova local controlada passou em `artifacts/audits/2026-07-18-w4-campaign-distribution-authority.md`; HML/produção ainda exigem prova própria.
- Backfill e migração operacional formal permanecem na frente dedicada de persistência.

## 2026-07-18 - Artwork e ImpactReview com autoridade por ambiente

### Contexto
- `CatalogItem` já tinha autoridade MySQL, mas arte e governança de impacto ainda dependiam de stores locais síncronos.
- O catálogo podia sobreviver ao processo enquanto a decisão editorial ou a revisão operacional desaparecia no reinício.

### Decisão
- Expandir os stores existentes de `Artwork` e `ImpactReview` para adapters assíncronos por ambiente.
- Usar MySQL quando `PAYMENT_PERSISTENCE=mysql` e manter JSON/SQLite somente em modo local/QA explicitamente declarado.
- Não criar store paralelo, rota V2 ou FK polimórfica artificial.
- Exigir que os consumidores aguardem a persistência antes de aplicar transições de curadoria, publicação, financeiro ou suporte.

### Consequência prática
- A cadeia `Artwork -> CatalogItem -> ImpactReview -> ready -> published` mantém a mesma autoridade após reinício.
- HML/produção ainda exigem prova própria.
- Backfill, versionamento de migração e rollback permanecem na W6.

## 2026-07-18 - Next.js full-stack como arquitetura principal

### Contexto
- A aplicacao ja concentra UI, Route Handlers, autenticacao, dominio e integracoes no mesmo repositorio Next.js.
- A existencia de `app/api/**` e `lib/**` nao representa um backend separado; representa o backend HTTP e a camada de dominio da propria aplicacao.
- A persistencia hibrida vinha permitindo confundir fallback local com fonte oficial de dados.

### Decisao
- Adotar oficialmente Next.js full-stack com App Router como arquitetura principal da UseRuah.
- Tratar `app/api/**/route.ts` como backend HTTP canonico.
- Tratar `lib/**` como camada canonica de aplicacao, dominio, RBAC, persistencia e integracoes.
- Nao criar servidor HTTP paralelo para os dominios existentes.
- Usar MySQL como fonte oficial nos ambientes integrados; JSON/SQLite ficam limitados a desenvolvimento, seeds e QA explicitamente configurado.
- Proibir fallback silencioso para arquivo local quando o modo MySQL estiver configurado.

### Consequencia pratica
- A proxima evolucao deve reforcar contratos, transacoes e adapters dentro da estrutura atual.
- Dominios que ainda persistem somente em arquivo local continuam parciais e nao devem ser apresentados como plenamente prontos para producao.
- A decisao arquitetural nao transforma automaticamente toda a persistencia atual em MySQL; a migracao de cada dominio precisa de prova propria.

### Arquivos que sustentam esta decisao
- `app/api/**/route.ts`
- `lib/**`
- `lib/mysql-runtime.ts`
- `docs/ARCHITECTURE.md`

## 2026-06-06 - Produto sem IA ativa e catalogo com midia editorial oficial

### Contexto
- O produto estava misturando promessa de IA com fluxos client-side frageis.
- O catalogo persistido dependia de `mockups` placeholder (`1x1`) que pareciam midia real, mas nao eram.

### Decisao
- Remover IA do produto publico por agora.
- Tornar busca e guia de estilo locais e deterministicas.
- Assumir assets editoriais em `public/assets/editorial/catalog/**` como midia oficial do catalogo.
- Bloquear publicacao de paths antigos de `mockups` no catalogo persistido.

### Consequencia pratica
- A experiencia fica mais honesta e previsivel.
- O front para de depender de provider externo e de asset falso.
- A volta de IA vira projeto futuro de backend, nao remendo de client.

### Arquivos que sustentam essa decisao
- `lib/brand-discovery.ts`
- `lib/product-artwork.ts`
- `scripts/catalog/generate-editorial-catalog-assets.mjs`
- `scripts/lib/catalog-seed-helpers.mjs`
- `scripts/qa/qa-product-guardrails.mjs`

### Criterio para revisao futura
- So revisar essa decisao quando houver pipeline real para IA server-side ou biblioteca visual real de produto substituindo o editorial.

### Referencia de reentrada
- Quando essas frentes forem retomadas, seguir `docs/PLANO_REENTRADA_IA_E_MIDIA_REAL.md`.
