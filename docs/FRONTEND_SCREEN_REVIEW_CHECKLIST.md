# Frontend Screen Review Checklist (Oficial)

Data de revisao: 2026-05-23
Owner: Produto + Frontend + QA

## Objetivo
Padronizar revisao de tela para evitar regressao visual, quebra funcional, falha de acesso por perfil e retrabalho em cadeia.

## Quando aplicar
- Toda alteracao em tela, componente visual, navegacao, layout ou fluxo frontend.
- Obrigatorio para rotas criticas: `account`, `admin`, `checkout`, `help-center`, `policies`, `shop`, `product`.

## Pilar 0 - Fonte de verdade antes da revisao
- [ ] Consultar `docs/DESIGN.md`.
- [ ] Consultar `docs/BRAND_COLOR_SYSTEM.md`.
- [ ] Consultar `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md`.
- [ ] Consultar `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md` quando houver header, menu, drawer, modal ou overlay.
- [ ] Consultar `docs/DESIGN_SYSTEM_ECOMMERCE_FLOWS.md` quando a tela tocar `shop`, `product`, `cart` ou `checkout`.

## Pilar 1 - Fidelidade Visual (Design QA)
- [ ] Comparar tela lado a lado com referencia (Figma/Adobe XD ou baseline visual aprovado).
- [ ] Validar tipografia, cores, espacamentos, bordas e hierarquia visual.
- [ ] Validar em `mobile`, `tablet` e `desktop`.
- [ ] Verificar imagens e icones sem distorcao/blur (especialmente em alta densidade).
- [ ] Garantir consistencia de header/footer nas rotas institucionais.
- [ ] Confirmar que nao houve reintroducao de vocabulos visuais legados fora do sistema aprovado, como `lumina-*` ou `accent-blue`.

## Pilar 2 - Consistencia de Codigo e Arquitetura
- [ ] Reutilizar componentes existentes (evitar duplicacao desnecessaria).
- [ ] Remover variaveis/trechos mortos e reduzir logica repetida.
- [ ] Manter padrao de estilo existente (evitar `!important` sem justificativa tecnica).
- [ ] Nao duplicar regra de role/session fora dos pontos oficiais:
  - `context/UserContext.tsx`
  - guards de layout (`app/account/layout.tsx`, `app/admin/layout.tsx`)
- [ ] Validar que a cor usada vem de token aprovado e nao de valor inventado fora da fonte oficial.
- [ ] Validar que a escala de camada usa apenas tokens semanticos (`z-header`, `z-overlay`, `z-drawer`, `z-modal`, `z-toast`), sem `z-index` arbitrario.
- [ ] Validar que a tela usa familia de grid coerente com o tipo de pagina:
  - `layout-grid-media` ou `layout-grid-feature` para superficies editoriais
  - `layout-grid-catalog` para listagem, vitrine e categoria
  - `layout-grid-product` para PDP e secoes derivadas
- [ ] Validar que `section-container` nao foi contornado com padding lateral paralelo sem justificativa explicita.
- [ ] Se o problema for sistemico, corrigir na fonte de verdade antes de aplicar remendo local.

## Pilar 3 - UX e Funcionalidade
- [ ] Testar estados: `hover`, `focus`, `active`, `disabled`.
- [ ] Testar estados de carregamento, vazio e erro.
- [ ] Clicar em todos os links/botoes da tela.
- [ ] Validar fluxo principal da pagina ponta a ponta.
- [ ] Executar smoke de navegacao para nao quebrar jornada principal:
  - `home -> shop -> product -> cart -> checkout`

## Pilar 4 - Acessibilidade e SEO
- [ ] Navegacao por teclado (`Tab`, `Enter`) funcional.
- [ ] `alt` descritivo em imagens relevantes.
- [ ] Estrutura semantica (`header`, `main`, `nav`, `footer`) coerente.
- [ ] Titulo e metadados coerentes para indexacao/social preview.
- [ ] Se houve mudanca textual relevante, revisar encoding/acentuacao e rodar `npm run qa:content:governance` quando aplicavel.

## Pilar 5 - Seguranca e Perfil de Acesso (Obrigatorio)
- [ ] Sem sessao autenticada: rota protegida redireciona para `/login`.
- [ ] `customer` nao acessa `admin`.
- [ ] `support_agent` acessa apenas rotas permitidas.
- [ ] `production_operator` acessa apenas rotas permitidas.
- [ ] `platform_admin` acessa todas as rotas administrativas esperadas.
- [ ] Backend nao depende apenas de header para ator; sessao assinada valida quando disponivel.

## Pilar 6 - Gate Tecnico de Pre-Merge (Obrigatorio)
- [ ] `npm run check` PASS.
- [ ] `npm run pr:gate` PASS.
- [ ] `npm run pr:impact` PASS com `EXECUTED_CHECKS` coerente.
- [ ] `npm run pr:premerge` PASS.
- [ ] Quando aplicavel, executar QA de dominio:
  - `npm run qa:coreops`
  - `npm run qa:payments21`
  - `npm run qa:exceptions`

## Evidencia minima por revisao de tela
- [ ] Registro curto do que foi validado (visual, funcional, acesso, a11y).
- [ ] Evidencia de comandos executados e status.
- [ ] Indicar explicitamente qual documento foi a fonte de verdade da revisao.
- [ ] Atualizacao de governanca quando houver mudanca estrutural:
  - `docs/EXECUTION_TRACKING.md`
  - `docs/CHANGELOG_GOVERNANCE.md`

## Criterio de bloqueio
- Se qualquer item obrigatorio falhar, PR nao deve ser mergeado.
