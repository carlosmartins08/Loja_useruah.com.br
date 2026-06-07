# Decisions

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
- `scripts/generate-editorial-catalog-assets.mjs`
- `scripts/catalog-seed-helpers.mjs`
- `scripts/qa-product-guardrails.mjs`

### Criterio para revisao futura
- So revisar essa decisao quando houver pipeline real para IA server-side ou biblioteca visual real de produto substituindo o editorial.

### Referencia de reentrada
- Quando essas frentes forem retomadas, seguir `docs/PLANO_REENTRADA_IA_E_MIDIA_REAL.md`.
