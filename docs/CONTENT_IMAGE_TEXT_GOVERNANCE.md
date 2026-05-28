# Content Image/Text Governance (Obrigatorio)

Data de revisao: 2026-05-27  
Owner: Produto + Design + Engenharia

## Objetivo
Padronizar troca e revisao de texto e imagem sem quebrar performance, acessibilidade, consistencia visual e conversao.

## Regra de decisao
- Se nao melhora entendimento, confianca ou decisao de compra, nao publica.
- Se quebra limite tecnico, nao publica.
- Se nao tem evidencia de QA, nao publica.

## Imagens: padrao obrigatorio por contexto
- `hero`: AVIF/WebP, ate `180KB` no mobile, `priority=true`, sem lazy.
- `product-gallery`: AVIF/WebP, ate `120KB`, lazy habilitado, `sizes` responsivo.
- `product-thumb`: AVIF/WebP, ate `60KB`, proporcao `1:1`.
- `content-banner`: AVIF/WebP, ate `140KB`, proporcao `16:9` ou `4:5` conforme bloco.
- `icon/logo`: SVG preferencial; PNG apenas quando necessario.

## Acessibilidade de imagem
- Imagem funcional/informativa: `alt` objetivo e curto.
- Imagem decorativa: `alt=""` e `aria-hidden`.
- Nao usar `alt` generico ("imagem", "foto", "banner").

## Texto: padrao obrigatorio
- CTA: 2 a 6 palavras, verbo claro.
- Titulo: ate 70 caracteres.
- Subtitulo: ate 140 caracteres.
- Paragrafo: frases curtas e objetivas.
- Erro/alerta: sempre com proximo passo pratico.

## UI e consistencia visual
- Proporcao consistente por bloco para evitar distorcao.
- Grid e alinhamento obrigatorios.
- Mesmo estilo visual por secao (tratamento e luz coerentes).

## Gate tecnico de PR
- Rodar `npm run qa:content:governance`.
- Rodar `npm run check`.
- Anexar evidencia desktop + mobile quando mudar Home, PDP ou Checkout.

## KPIs minimos de acompanhamento semanal
- LCP mobile da Home.
- LCP mobile da PDP.
- Taxa de add-to-cart da PDP.
- Conversao do checkout.
- Bounce rate das paginas alteradas.

## Criterio de rollback
- Reverter lote de conteudo se houver regressao relevante de LCP ou queda estatisticamente relevante de add-to-cart/conversao apos mudanca.
