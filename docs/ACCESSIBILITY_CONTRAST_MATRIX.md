# Accessibility Contrast Matrix

Data de revisao: 2026-05-30

## Objetivo
Definir pares de cor aprovados para texto funcional e orientar bloqueio de combinacoes de baixo contraste.

## Pares aprovados (uso de texto)
- `ruah-950` em `white`
- `ruah-950` em `ruah-50`
- `white` em `ruah-950`
- `accent-gold` em `ruah-950` para label curta

## Pares restritos
- `ruah-300` em `white` para corpo de texto
- `ruah-300` em `ruah-50` para corpo de texto
- `accent-gold` em `ruah-50` para texto pequeno

## Regras
- Texto funcional deve atender AA.
- Labels pequenas devem priorizar `ruah-950` ou `white` conforme fundo.
- Sempre garantir `focus-visible` com contorno perceptivel.

