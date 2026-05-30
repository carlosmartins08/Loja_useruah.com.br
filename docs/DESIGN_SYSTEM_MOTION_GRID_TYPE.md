# Design System Motion Grid Type

Data de revisao: 2026-05-30
Owner: Produto + Design + Engenharia Frontend

## Objetivo
Formalizar os contratos de motion, grid/layout e escala tipografica responsiva para eliminar drift visual entre home, product e novas rotas.

## 1. Motion System

### 1.1 Duracoes canonicas
- `--motion-fast`: 160ms
- `--motion-base`: 240ms
- `--motion-slow`: 400ms
- `--motion-glacial`: 700ms

### 1.2 Easings canonicos
- `--ease-enter`: cubic-bezier(0.22, 1, 0.36, 1)
- `--ease-exit`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-emphasis`: cubic-bezier(0.2, 0.8, 0.2, 1)

### 1.3 Orquestracao obrigatoria
- Entrada de secao: stagger de 80ms entre itens.
- Hover de midia: usar `motion-slow` para imagem e `motion-base` para overlay.
- Feedback de CTA: `motion-fast` para states de hover/active.

## 2. Grid and Layout System

### 2.1 Container oficial
- `section-container`:
  - max width: 1280px
  - padding horizontal: 16px mobile, 24px tablet, 32px desktop

### 2.2 Espacamento vertical
- `section-space`: 96px mobile, 128px desktop
- `section-space-lg`: 128px mobile, 160px desktop

### 2.3 Grids semanticos
- `layout-grid-product`: `1 col mobile`, `12 cols desktop`, gap 48px
- `layout-grid-feature`: `1 col mobile`, `10 cols desktop`, gap 64px
- `layout-grid-media`: `1 col mobile`, `12 cols desktop`, gap 64px

## 3. Escala Responsiva de Tipografia

### 3.1 Displays semanticos
- `ur-type-display-xl`: clamp(2.5rem, 8vw, 7rem)
- `ur-type-display-lg`: clamp(2.25rem, 6vw, 5.5rem)
- `ur-type-display-md`: clamp(1.9rem, 4.5vw, 4rem)

### 3.2 Tabela de referencia
- 375px:
  - display-xl: 40px
  - display-lg: 36px
  - display-md: 30px
- 768px:
  - display-xl: 58px
  - display-lg: 48px
  - display-md: 38px
- 1280px:
  - display-xl: 90px
  - display-lg: 74px
  - display-md: 56px
- 1440px:
  - display-xl: 112px
  - display-lg: 88px
  - display-md: 64px

## 4. Iconografia e Decoracao
- Tamanhos canonicos:
  - `icon-sm`: 14
  - `icon-md`: 18
  - `icon-lg`: 24
- Stroke padrao: 1.75
- Linha gold: usar utility `decor-gold-line`.
- Ponto de status: usar `pulse-soft`.
- Watermark rotacionado: usar `watermark-editorial`.

## 5. Image and Media
- Aspect ratios oficiais:
  - produto: `3:4` ou `1:1` quando hero isolado
  - video: `16:9`
  - avatar/ugc: `1:1`
- Hover de imagem:
  - escala: `hover:scale-[1.05]`
  - grayscale: usar apenas em contexto editorial.

## 6. Form Inputs e Feedback
- Estados obrigatorios em componentes de input:
  - `default`, `focus-visible`, `disabled`, `error`
- Feedback:
  - botao com loading deve manter largura e label previsivel
  - skeleton para blocos de dados assincronos
  - toast para confirmacao de acao e erro recuperavel

## 7. Dark Mode
- Decisao atual: `light-first` com dark parcial manual em secoes editoriais.
- Sem suporte global `prefers-color-scheme` por enquanto.
- Nova rota so pode introduzir dark nativo com ADR previa.

## 8. Acessibilidade e Contraste
- Contraste minimo AA em texto funcional.
- `focus-visible` obrigatorio para links, botoes e campos.
- Hover nao pode ser unico sinal de estado.

## 9. Voice and Tone
- Linguagem orientada a proximo passo.
- Evitar CTA generico sem personalidade.
- Nomenclatura funcional deve seguir glossario em `docs/UI_VOICE_TONE_GLOSSARY.md`.

