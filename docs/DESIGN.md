# DESIGN.md - Contrato de Design do Produto

Data de revisao: 2026-05-30
Owner: Produto + Design + Engenharia

## 1) Objetivo
Garantir consistencia de experiencia em todo o projeto Use Ruah, preservando:
- identidade da pagina principal;
- clareza operacional dos ambientes logados;
- coerencia entre papeis (customer, artist, supplier, admin, suporte, financeiro).

Este documento define como desenhar e como validar o frontend antes de publicar.

## 2) Principios de design (nao negociaveis)
1. Clareza antes de efeito visual.
2. Um usuario deve entender o que fazer em ate 3 segundos por tela.
3. Acao critica em no maximo 2 cliques no admin.
4. Texto de interface sempre orientado a proximo passo.
5. Consistencia de layout e componentes em todo fluxo.

## 3) Linguagem visual por contexto

### 3.1 Pagina principal e loja (brand-first)
- Pode usar linguagem editorial (hero, narrativa, atmosfera).
- Serif para destaque emocional e sans para funcao.
- Gradientes, textura e composicao com intencao de marca.

### 3.2 Ambientes logados operacionais (task-first)
- Priorizar densidade de informacao e escaneabilidade.
- Estrutura previsivel: menu fixo, topo funcional, cards utilitarios.
- Sem poetizacao excessiva em rotas transacionais.

## 4) App shell obrigatorio

### 4.1 Shell de ambientes privados
Todo ambiente privado deve seguir:
1. Header com contexto de usuario/papel.
2. Navegacao principal persistente (sidebar desktop / menu mobile).
3. Area central por tarefa (conteudo da rota).
4. Acoes rapidas contextuais.
5. Rodape discreto com links institucionais e status.

### 4.2 Navegacao global publica
Toda rota publica deve respeitar contrato de navegacao em:
- `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md`

Estados minimos obrigatorios:
- header no topo;
- header sticky em scroll;
- menu mobile aberto;
- carrinho vazio e com itens;
- usuario anonimo e autenticado.

## 5) Estrutura padrao de dashboard (admin e operadores)
Ordem obrigatoria:
1. Barra superior: busca global + contexto do usuario.
2. Linha de KPIs: 4 a 6 metricas principais.
3. Bloco analitico principal: tendencia/grafico.
4. Blocos secundarios: fila de decisao + saude operacional.
5. Coluna lateral: agenda, alertas e pendencias.

## 6) Padrao de componentes

### 6.1 Componentes base
- Button
- Input
- Select
- Badge de status
- Card de KPI
- Data table
- Empty state
- Alert/Toast
- Modal/Drawer

### 6.2 Estados obrigatorios de cada componente/tela
- loading
- empty
- success
- error
- blocked/no_permission

### 6.3 Status semantico padrao
- neutro: cinza
- info: azul
- sucesso: verde
- alerta: amarelo
- critico: vermelho

## 7) Fluxos de ecommerce (contrato de produto)
Fonte de verdade:
- `docs/DESIGN_SYSTEM_ECOMMERCE_FLOWS.md`

Nenhuma entrega em `shop`, `product`, `cart` ou `checkout` pode ignorar estados de:
- variacao indisponivel;
- erro de validacao de selecao;
- carregamento assincrono;
- falha de pagamento recuperavel;
- sucesso e proximo passo.

## 8) Conteudo e microcopy
- Evitar termos de backend na interface.
- Cada mensagem deve responder: o que ocorreu + o que fazer agora.
- Padrao de erro:
  - titulo curto
  - causa em linguagem humana
  - acao recomendada

Observacao de escopo:
- linguagem poetica/branding vale para contexto comercial/editorial;
- contexto operacional deve priorizar objetividade e acao.

## 9) Tipografia
Fonte de verdade: `docs/TYPOGRAPHY_UX_UI_CHECKLIST.md`
Complemento sistemico: `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md`

Regras reforcadas:
- texto funcional >= 16px;
- line-height de corpo >= 1.5;
- no maximo 2 familias por tela;
- foco visual em contraste e hierarquia, nao em efeitos.

## 10) Cor e identidade
Fonte de verdade: `docs/BRAND_COLOR_SYSTEM.md`
Contraste e acessibilidade: `docs/ACCESSIBILITY_CONTRAST_MATRIX.md`

Regras reforcadas:
- nao criar cor fora de token aprovado;
- nao criar variacao de logo fora dos arquivos oficiais;
- diferenciar cor de marca x cor de produto x cor de estampa.

## 11) Camadas, overlays e conflitos visuais
- Escala de `z-index` e contratos de sobreposicao sao obrigatorios.
- Nao usar valores arbitrarios para resolver bug local.
- Fonte de verdade: `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md` e `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md`.

## 12) Acessibilidade e usabilidade
- Contraste minimo AA em texto funcional.
- Navegacao por teclado nas acoes principais.
- `focus-visible` obrigatorio em links, botoes e inputs.
- Hover nunca pode ser o unico sinal de interacao.
- Overlay/drawer/modal devem suportar ESC, click externo e trap de foco.

## 13) Responsividade

### Mobile
- Priorizar fluxo por cards e CTA claro.
- Menu compacto, acao principal visivel.
- Evitar tabela densa sem alternativa.

### Desktop
- Sidebar + area principal + painel lateral quando necessario.
- Tabelas e comparativos para tarefas operacionais.

## 14) Governanca (evitar retrabalho)
Antes de subir PR de frontend:
1. Validar este `DESIGN.md`.
2. Validar `docs/BRAND_COLOR_SYSTEM.md`.
3. Validar `docs/TYPOGRAPHY_UX_UI_CHECKLIST.md`.
4. Validar `docs/DESIGN_SYSTEM_MOTION_GRID_TYPE.md`.
5. Validar `docs/DESIGN_SYSTEM_NAVIGATION_AND_OVERLAYS.md`.
6. Validar `docs/DESIGN_SYSTEM_ECOMMERCE_FLOWS.md`.
7. Validar `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`.
8. Validar `docs/UI_VOICE_TONE_GLOSSARY.md`.
9. Se houver mudanca de rota/UX, validar `docs/ROUTE_DEFINITION_OF_DONE.md`.

Regra operacional anti-drift:
- excecao local nao substitui contrato global;
- se token, grid, camada ou container estiverem errados em mais de uma tela, corrigir na fonte de verdade antes da pagina;
- nenhuma variacao visual nova entra sem justificar por que o sistema atual nao cobre o caso.

## 15) Definition of Done (frontend)
Uma tela so esta pronta se:
1. segue app shell padrao;
2. usa componentes/tokens aprovados;
3. possui estados de loading/empty/error;
4. possui copy clara e orientada a acao;
5. passa revisao de acessibilidade basica;
6. nao cria duplicidade de navegacao/regra;
7. respeita contratos de camada e overlay;
8. documenta excecao quando fugir do padrao.

## 16) O que este documento nao permite
- criar tela isolada sem padrao de shell;
- inventar nomenclatura nova para mesma acao;
- esconder restricao de permissao apenas no frontend;
- trocar visual sem validar impacto em fluxo operacional;
- corrigir conflito visual com `z-index` arbitrario sem atualizar contrato.
