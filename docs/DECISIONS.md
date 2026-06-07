# Decisions

## 2026-06-06 — Produto sem IA ativa e catálogo com mídia editorial oficial

### Contexto
- O produto estava misturando promessa de IA com fluxos client-side frágeis.
- O catálogo persistido dependia de `mockups` placeholder (`1x1`) que pareciam mídia real, mas não eram.

### Decisão
- Remover IA do produto público por agora.
- Tornar busca e guia de estilo locais e determinísticos.
- Assumir assets editoriais em `public/assets/editorial/catalog/**` como mídia oficial do catálogo.
- Bloquear publicação de paths antigos de `mockups` no catálogo persistido.

### Consequência prática
- A experiência fica mais honesta e previsível.
- O front para de depender de provider externo e de asset falso.
- A volta de IA vira projeto futuro de backend, não remendo de client.

### Arquivos que sustentam essa decisão
- `lib/brand-discovery.ts`
- `lib/product-artwork.ts`
- `scripts/generate-editorial-catalog-assets.mjs`
- `scripts/catalog-seed-helpers.mjs`
- `scripts/qa-product-guardrails.mjs`

### Critério para revisão futura
- Só revisar essa decisão quando houver pipeline real para IA server-side ou biblioteca visual real de produto substituindo o editorial.
