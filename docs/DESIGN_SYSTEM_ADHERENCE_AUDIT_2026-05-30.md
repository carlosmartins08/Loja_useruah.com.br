# Design System Adherence Audit (End-to-End)

Data: 2026-05-30
Owner: Produto + Design + Engenharia Frontend
Base de contrato:
- `docs/DESIGN.md`
- `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md`
- `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md`
- `docs/DESIGN_SYSTEM_ECOMMERCE_FLOWS.md`

Nota de leitura atual:
- referencias a `components/ai/VirtualAssistant.tsx` abaixo pertencem ao recorte historico desta auditoria;
- o runtime atual segue `docs/AI_RULES.md` e nao possui esse componente montado.

## 1) Leitura executiva
O projeto tem boa base visual e fluxos funcionais, mas ainda viola contratos novos em pontos críticos:
1. Camadas e `z-index` fora da escala oficial.
2. Overlays sem padrao completo de acessibilidade (foco/trap).
3. Sticky bar de PDP com comportamento divergente do contrato de compra.
4. Rotas com alto apelo visual, mas baixa padronizacao de estados de erro em alguns fluxos.

## 2) Matriz por rota critica

| Rota/Area | Status | Resultado |
| --- | --- | --- |
| `/shop` | Parcial | Estrutura de filtro/ordenacao existe, mas sem contrato completo de estados de filtro/empty robusto. |
| `/product/[id]` | Parcial | PDP rica e funcional, mas sticky bar e camadas violam contrato de overlay/z-index. |
| `/cart` | Nao conforme | Tela ainda mockada/estatica, sem acoplamento real ao estado do carrinho. |
| `/checkout` | Parcial | Fluxo principal existe com estados e erro inline, faltam refinamentos de validacao e consistencia de densidade/overlay. |
| Header global | Parcial | Estados existem, mas menu mobile/overlays sem escala de camada formal e sem foco controlado. |
| Cart drawer | Parcial | Fecha por ESC/click externo e usa dialog, mas sem trap de foco e com `z-index` arbitrario. |
| Breadcrumb | Parcial | Estrutura semantica correta, mas separador diverge do contrato aprovado. |
| Layout `/account` | Conforme | Shell operacional consistente com sidebar e hierarquia clara. |
| Layout `/admin` | Conforme | Shell operacional consistente com navegação persistente e topo contextual. |

## 3) Achados prioritarios (por severidade)

## Critico
1. Escala de camadas quebrada por valores arbitrarios de `z-index`.
- Evidencias:
  - `components/commerce/ExitIntent.tsx:101` usa `z-[200]`
  - `components/commerce/ProductMediaGallery.tsx:74` usa `z-[120]`
  - `components/ai/VirtualAssistant.tsx:136` usa `z-[110]`
  - `components/commerce/CartDrawer.tsx:36` usa `z-[100]`
  - `components/commerce/CartDrawer.tsx:48` usa `z-[101]`
- Impacto: conflitos de sobreposicao e regressao imprevisivel em qualquer novo modal/drawer/toast.

2. `/cart` nao representa o estado real do carrinho.
- Evidencia:
  - `app/cart/page.tsx` renderiza itens hardcoded (`[1, 2]`) e valores fixos.
- Impacto: quebra de consistencia com contrato de fluxo ecommerce e risco de UX enganosa.

## Alto
1. Overlays/dialogs sem padrao completo de foco.
- Evidencias:
  - `components/commerce/CartDrawer.tsx:46` e `components/commerce/ProductMediaGallery.tsx:74` usam `aria-modal`, mas nao ha trap de foco.
  - `components/navigation/Header.tsx` menu mobile abre/fecha por clique, mas sem controle de foco de ciclo.
- Impacto: acessibilidade incompleta e navegacao por teclado inconsistente.

2. Sticky mobile da PDP com acao desalinhada ao contrato de compra.
- Evidencias:
  - `components/commerce/StickyMobileBar.tsx:11` barra fixa no rodape.
  - `components/commerce/StickyMobileBar.tsx:19` CTA faz `window.scrollTo` em vez de acao de compra definida.
- Impacto: reduz previsibilidade do funil em mobile.

3. Breadcrumb fora do contrato de separador padrao.
- Evidencias:
  - `components/navigation/Breadcrumbs.tsx:35` usa `ChevronRight`.
  - Contrato aprovado pede separador textual padronizado.
- Impacto: inconsistencia entre telas e com a especificacao nova.

## Medio
1. Header concentra muita variacao visual e comportamento, com risco de drift.
- Evidencias:
  - `components/navigation/Header.tsx` combina topbar, mega menu, menu mobile, overlays e acoes de perfil em um componente unico.
- Impacto: manutencao dificil e regressao em estados combinados.

2. Checkout tem estados principais, mas validacao de formulario pode evoluir.
- Evidencias:
  - `components/checkout/CheckoutPageView.tsx:37` trata vazio e sucesso.
  - `components/checkout/CheckoutPageView.tsx:166` possui erro inline via `role="alert"`.
  - `components/checkout/sections/CheckoutStepOneSection.tsx` nao mostra matriz completa de erro por campo.
- Impacto: cobertura de erro funcional, mas sem granularidade maxima de UX.

## 4) Pontos que ja estao bons
1. Fluxo base de checkout integrado com API e idempotencia:
- `components/checkout/CheckoutPageView.tsx`
2. Estrutura operacional de `account`:
- `app/account/layout.tsx`
3. Estrutura operacional de `admin`:
- `app/admin/layout.tsx`
4. Drawer e alguns modais com fechamento por ESC:
- `components/commerce/CartDrawer.tsx:18`
- `components/commerce/ExitIntent.tsx:87`

## 5) Plano de correção (de ponta a ponta)

### Fase 1 (bloqueante de consistencia)
1. Migrar todos `z-[...]` para tokens da escala oficial (`z-header`, `z-overlay`, `z-drawer`, `z-modal`, `z-toast`).
2. Implementar trap de foco utilitario e aplicar em:
  - menu mobile do header
  - cart drawer
  - zoom gallery
  - overlays centrais
3. Alinhar sticky bar da PDP ao contrato (CTA de compra contextual e trigger por observer).

### Fase 2 (fluxo ecommerce completo)
1. Refatorar `app/cart/page.tsx` para consumir estado real do `CartContext`.
2. Formalizar estados de cart:
  - vazio
  - com itens
  - atualizando quantidade
  - erro de atualizacao
3. Fechar padrao de filtros do `/shop` (filtro ativo, limpar filtros, estado sem resultados com CTA).

### Fase 3 (refino e governanca)
1. Ajustar breadcrumb para separador padrao do contrato.
2. Extrair contratos de estado do Header para subcomponentes menores.
3. Adicionar checklist automatizado de conformidade visual/estrutural em PR (lint de tokens de camada e guardrails de overlay).

## 6) Conclusao objetiva
Base atual permite evolucao rapida, mas sem corrigir camadas + foco + cart real, qualquer nova tela aumenta risco de regressao. Prioridade correta agora e estabilizar infraestrutura de interface antes de expandir novos blocos visuais.
