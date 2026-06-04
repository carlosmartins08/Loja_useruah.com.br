# Design System - Navigation and Overlays

Data de revisao: 2026-05-30
Owner: Produto + Design + Engenharia Frontend

## 1) Objetivo
Definir contrato unico para navegacao global, menu mobile, dropdowns, breadcrumb, sticky bars, drawers e modais.

## 2) Header global
Estados obrigatorios:
1. `top/neutral`
2. `scrolled/sticky`
3. `authenticated`
4. `mobile-open`

Regras:
- altura desktop: 64-72;
- altura mobile: 52-56;
- transicao top -> sticky: 240-300ms;
- header nunca pode conflitar com drawer/modal em camada.

## 3) Navegacao mobile
- Menu abre da direita para esquerda.
- Entrada: 300-350ms `ease-enter`.
- Saida: 200-240ms `ease-exit`.
- Fechamento por:
  - botao fechar
  - click no overlay
  - tecla ESC
  - gesto de retorno (quando aplicavel)
- Obrigatorio trap de foco enquanto aberto.

## 4) Dropdown de navegacao
- `z-dropdown` obrigatorio.
- Trigger com `hover` e `focus-visible`.
- Fechamento ao perder foco de contexto e ao pressionar ESC.
- Itens devem ter alvo minimo de 44x44 quando clicaveis.

## 5) Breadcrumb
- Deve existir em rotas com profundidade hierarquica.
- Ultimo item nao e link.
- Separador padrao unico no produto.
- Nunca usar breadcrumb para substituir titulo da pagina.

## 6) Cart drawer e overlays
- Overlay padrao em `z-overlay`.
- Drawer em `z-drawer`.
- Largura:
  - mobile: 100vw
  - desktop: 320-420
- Comportamento minimo:
  - lista de itens
  - controle de quantidade
  - remover item
  - subtotal/total
  - CTA de checkout

## 7) Modal
- Modal sempre acima de drawer.
- Fechamento por ESC e click externo (exceto casos bloqueantes justificados).
- `aria-modal`, `role=dialog`, foco inicial e retorno de foco obrigatorios.

## 8) Sticky bars
- Usar `z-sticky`.
- Nao pode esconder CTA critico principal.
- Trigger deve ser deterministico (ex.: observer do CTA original).

## 9) Escala de camadas
Seguir estritamente `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md`:
- `z-base`, `z-raised`, `z-sticky`, `z-dropdown`, `z-header`, `z-overlay`, `z-drawer`, `z-modal`, `z-toast`, `z-max`.

## 10) Anti-padroes proibidos
- Resolver conflito com `z-index: 999` local.
- Header novo sem mapear estados obrigatorios.
- Drawer sem overlay clicavel.
- Modal sem acessibilidade de teclado.
- Duplicar padrao de menu por rota sem justificativa.

## 11) Checklist de PR
1. Estados de header foram testados em desktop e mobile.
2. Dropdown/menu/drawer respeitam foco e ESC.
3. Camadas respeitam escala oficial.
4. Overlay fecha sem dead-end de navegacao.
5. Nenhum elemento critico fica inacessivel por sobreposicao.
