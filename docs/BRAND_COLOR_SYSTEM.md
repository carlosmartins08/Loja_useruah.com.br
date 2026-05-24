# Brand Color System (Contrato Tecnico)

Data de revisao: 2026-05-24  
Owner: Produto + Design + Engenharia

## Objetivo
Padronizar variacoes de cor em quatro camadas independentes para evitar retrabalho entre UI, catalogo, mockup, SKU e fornecedor.

## Camadas obrigatorias
1. Cores da marca (`data/brand-colors.json`)
2. Cores de produto (`data/product-colors.json`)
3. Cores de estampa (`data/print-colors.json`)
4. Cores e arquivos de mockup (`public/assets/products/mockups`)

## Regras de logo
- Logo oficial apenas em `dark` e `light`.
- Arquivos oficiais:
  - `/public/brand/SVG/logo-wordmark-dark.svg`
  - `/public/brand/SVG/logo-wordmark-light.svg`
  - `/public/brand/SVG/logo-mark-dark.svg`
  - `/public/brand/SVG/logo-mark-light.svg`
- Nao criar logos por cor de paleta.

## Regras de produto
- Cor comercial exige:
  - `colorSlug`
  - `displayHex`
  - `supplierColorName`
  - `supplierColorCode`
  - `textColor`
  - `logoVariant`
- `displayHex` (site) e `supplierColorCode` (producao) sao obrigatorios e independentes.

## Regras de estampa
- Estampa precisa seguir contraste minimo por tipo de peca.
- Bloquear publicacao quando nao houver leitura em miniatura/mobile.

## Estrutura de mockup (padrao)
`/public/assets/products/mockups/{produto}/{cor}/mockup-{produto}-{cor}-{vista}.png`

## Gate tecnico
- Comando: `npm run qa:brand:colors`
- Valida:
  - integridade dos manifests de cor
  - logo files obrigatorios
  - duplicidade e formato HEX
  - warning para mockup root ausente

## Roadmap de rollout
- Fase 1: `offwhite-oracao`, `preto-presenca`, `areia-serena`
- Fase 2: `terracota-humana`, `azul-silencio`, `verde-oliva`
