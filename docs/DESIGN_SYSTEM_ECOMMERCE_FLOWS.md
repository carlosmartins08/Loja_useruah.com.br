# Design System - Ecommerce Flows

Data de revisao: 2026-05-30
Owner: Produto + Design + Engenharia Frontend

## 1) Objetivo
Padronizar fluxos visuais e estados de produto, carrinho e checkout para evitar inconsistencia entre paginas e regressao de conversao.

## 2) Escopo
- `shop`
- `product` (PDP)
- `cart`
- `checkout`
- `success`

## 3) PDP (pagina de produto)
Estados obrigatorios:
1. produto carregando (skeleton realista)
2. produto disponivel
3. variacao indisponivel
4. tamanho/atributo nao selecionado com erro de validacao
5. erro de carregamento
6. sem estoque

Comportamentos obrigatorios:
- selecao de variacao com feedback claro;
- CTA principal bloqueado quando selecao incompleta;
- feedback de erro inline (nao so toast);
- galeria com comportamento mobile coerente;
- sticky buy bar mobile apos scroll do CTA principal.

## 4) Cart (pagina e drawer)
Estados obrigatorios:
1. vazio
2. com itens
3. atualizando quantidade
4. erro ao atualizar item
5. erro de calculo de frete/total

Comportamentos obrigatorios:
- controle de quantidade com limites min/max;
- remover item com confirmacao adequada quando risco de perda;
- subtotal/total visivel;
- CTA de checkout sempre perceptivel.

## 5) Checkout
Estados obrigatorios:
1. carregando sessao/pagamento
2. formulario incompleto
3. validacao de campo
4. processamento de pagamento
5. pagamento aprovado
6. pagamento recusado recuperavel
7. erro temporario de infraestrutura

Regras:
- cada erro deve dizer causa e proximo passo;
- manter idempotencia visual no botao de pagamento (sem duplo submit);
- loading sem quebrar layout;
- resumo do pedido sempre visivel em pelo menos um breakpoint.

## 6) Formularios de checkout
Campos criticos:
- identificacao
- endereco (incluindo CEP)
- contato
- metodo de pagamento

Regras de UX:
- label explicita;
- erro inline;
- mascara quando aplicavel;
- foco previsivel apos erro;
- `autocomplete` habilitado onde fizer sentido.

## 7) Filtros e catalogo (`shop`)
Padroes obrigatorios:
- filtro ativo visivel;
- acao de limpar filtros;
- estado sem resultados com CTA de recuperacao;
- ordenacao consistente;
- comportamento claro de paginacao ou load-more (nao misturar sem regra).

## 8) Empty, loading e feedback
- empty state com contexto + acao;
- skeleton mantendo forma do componente final;
- toast para evento global;
- erro de campo e de bloco deve aparecer inline.

## 9) Acessibilidade
- foco visivel em todos elementos interativos;
- alvo minimo 44x44;
- contraste AA em texto funcional;
- componentes interativos operaveis por teclado.

## 10) Anti-padroes proibidos
- CTA de compra ativo sem variacao obrigatoria selecionada.
- Erro critico apenas em toast efemero.
- Fluxo de checkout sem estado de processamento explicito.
- Layout que muda de tamanho de forma abrupta no loading.
- Componente novo de ecommerce sem mapear estados acima.

## 11) Checklist de PR
1. PDP testada com produto completo e incompleto.
2. Variacao indisponivel bloqueia compra de forma clara.
3. Cart vazio e cart com itens estao consistentes.
4. Checkout cobre validacao, processamento, sucesso e falha.
5. Fluxo completo `shop -> product -> cart -> checkout -> success` validado.
