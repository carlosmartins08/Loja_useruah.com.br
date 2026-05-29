# DESIGN.md - Contrato de Design do Produto

Data de revisao: 2026-05-29  
Owner: Produto + Design + Engenharia

## 1) Objetivo
Garantir consistencia de experiencia em todo o projeto Use Ruah, preservando:
- identidade da pagina principal;
- clareza operacional dos ambientes logados;
- coerencia entre papeis (customer, artist, supplier, admin, suporte, financeiro).

Este documento define **como desenhar** e **como validar** o frontend antes de publicar.

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

## 4) App shell obrigatorio (todos ambientes privados)
Todo ambiente privado deve seguir:
1. Header com contexto de usuario/papel.
2. Navegacao principal persistente (sidebar desktop / menu mobile).
3. Area central por tarefa (conteudo da rota).
4. Acoes rapidas contextuais.
5. Rodape discreto com links institucionais e status.

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

## 7) Conteudo e microcopy
- Evitar termos de backend na interface.
- Cada mensagem deve responder: o que ocorreu + o que fazer agora.
- Padrao de erro:
  - Titulo curto
  - Causa em linguagem humana
  - Acao recomendada

## 8) Tipografia
Fonte de verdade: `docs/TYPOGRAPHY_UX_UI_CHECKLIST.md`

Regras reforcadas:
- texto funcional >= 16px;
- line-height de corpo >= 1.5;
- no maximo 2 familias por tela;
- foco visual em contraste e hierarquia, nao em efeitos.

## 9) Cor e identidade
Fonte de verdade: `docs/BRAND_COLOR_SYSTEM.md`

Regras reforcadas:
- nao criar cor fora de token aprovado;
- nao criar variacao de logo fora dos arquivos oficiais;
- diferenciar cor de marca x cor de produto x cor de estampa.

## 10) Acessibilidade e usabilidade
- Contraste minimo AA em texto funcional.
- Navegacao por teclado nas acoes principais.
- `focus-visible` obrigatorio em links, botoes e inputs.
- Hover nunca pode ser o unico sinal de interacao.

## 11) Responsividade

### Mobile
- Priorizar fluxo por cards e CTA claro.
- Menu compacto, acao principal visivel.
- Evitar tabela densa sem alternativa.

### Desktop
- Sidebar + area principal + painel lateral quando necessario.
- Tabelas e comparativos para tarefas operacionais.

## 12) Governanca (evitar retrabalho)
Antes de subir PR de frontend:
1. Validar este DESIGN.md.
2. Validar `docs/BRAND_COLOR_SYSTEM.md`.
3. Validar `docs/TYPOGRAPHY_UX_UI_CHECKLIST.md`.
4. Validar checklist integrado em `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`.

## 13) Definition of Done (frontend)
Uma tela so esta pronta se:
1. segue app shell padrao;
2. usa componentes/tokens aprovados;
3. possui estados de loading/empty/error;
4. possui copy clara e orientada a acao;
5. passa revisao de acessibilidade basica;
6. nao cria duplicidade de navegacao/regra.

## 14) O que este documento nao permite
- criar tela isolada sem padrao de shell;
- inventar nomenclatura nova para mesma acao;
- esconder restricao de permissao apenas no frontend;
- trocar visual sem validar impacto em fluxo operacional.

