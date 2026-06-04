# Design System Maturity Audit (2026-05-30)

Owner: Produto + Design + Frontend
Status: Aprovado para incorporacao parcial com curadoria tecnica

## 1) Objetivo
Consolidar contribuicoes dos arquivos externos:
- `useruah_design_system.html`
- `useruah_ds_parte1_fundamentos.html`
- `useruah_ds_parte2_componentes.html`
- `useruah_ds_bloco1_navegacao.html`

Sem degradar os contratos atuais em `docs/`.

## 2) Decisao executiva
- Incorporar: regras estruturais e tokens ausentes no contrato atual.
- Nao incorporar como fonte de verdade: HTMLs completos de showcase (sao demos, nao especificacao tecnica robusta).
- Criticidade: alta para navegacao global, z-index, overlays, e estados de fluxo de ecommerce.

## 3) O que entra (alto valor)

### 3.1 Navegacao global e estados de header
- Definir estados oficiais:
  - top/neutral
  - sticky/scrolled
  - authenticated
  - mobile menu open
- Definir comportamento entre elementos: header x dropdown x drawer x sticky mobile bar.

### 3.2 Escala de camadas (z-index)
- Adotar escala nomeada unica:
  - `z-base: 0`
  - `z-raised: 10`
  - `z-sticky: 30`
  - `z-dropdown: 35`
  - `z-header: 40`
  - `z-overlay: 45`
  - `z-drawer: 50`
  - `z-modal: 60`
  - `z-toast: 70`
  - `z-max: 9999` (uso excepcional)

### 3.3 Contrato de overlay/drawer/modal
- Backdrop padrao, fechamento por click externo, foco preso, escape para fechar.
- Regras de abertura/fechamento com timing canônico.

### 3.4 Fluxos ecommerce que faltavam no contrato
- PDP: variacao indisponivel, tamanho nao selecionado, sticky buy bar mobile, galeria/zoom.
- Cart Drawer e Mini Cart.
- Checkout por etapas e estados de erro claros.

### 3.5 Densidade responsiva por componente
- Formalizar no contrato: espaco e tamanho por breakpoints para componentes criticos.

## 4) O que NAO entra (ou entra com ajuste)

### 4.1 Tokens fixos com fonte tipografica hardcoded
- Exemplo de risco: forcar "Georgia/Playfair" de modo absoluto sem mapear para tokens atuais do projeto.
- Acao: manter tipografia por token sem travar implementacao em nome de fonte dentro de doc de comportamento.

### 4.2 Microcopy poetica como regra global
- Conteudos como "Seu Sopro", "Entrega Sagrada" sao bons para marca, mas nao devem virar obrigacao em telas operacionais/admin.
- Acao: manter isso no glossario de voz com escopo por contexto.

### 4.3 Valores visuais sem rastreabilidade tecnica
- Demos com valores isolados (ex.: radius/sombra/padding locais) sem vinculo com `data/*.json` e CSS vars.
- Acao: qualquer valor novo so entra se virar token nomeado e reutilizavel.

## 5) Gaps ainda abertos apos incorporacao
- Tabelas complexas (sort, filtro, paginação, estados vazios por tipo).
- Formularios avancados (autocomplete, upload com progresso, mascara de cartao, date picker).
- Padrão completo de filtros/catalogo (chips ativos, clear-all, no-results).
- Componentes do Ruah Lab AI (geracao, progresso, erro, galeria de resultados).
- Decisao final de dark mode global (ou veto explicito de escopo).

## 6) Mudancas propostas no conjunto de docs
- Atualizar `docs/DESIGN.md` com:
  - contrato de navegacao global
  - overlays
  - estados obrigatorios de fluxos ecommerce
- Atualizar `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md` com:
  - escala de z-index
  - densidade responsiva por componente
- Criar `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md` (fonte de verdade para header/menu/drawer/modal).
- Criar `docs/DESIGN_SYSTEM_ECOMMERCE_FLOWS.md` (PDP, Cart, Checkout, estados).

## 7) Criterio de qualidade para aceitar novos blocos visuais
Um bloco novo so entra no sistema se cumprir:
1. Vira token/contrato reutilizavel.
2. Tem estado default/hover/focus/disabled/error quando aplicavel.
3. Tem regra mobile e desktop.
4. Nao conflita com acessibilidade AA e focus-visible.
5. Nao cria duplicidade de padrao com o que ja existe.

