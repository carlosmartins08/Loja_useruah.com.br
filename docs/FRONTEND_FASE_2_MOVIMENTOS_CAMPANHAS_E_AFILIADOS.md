# Frontend da Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-18

## Objetivo
Definir como o escopo funcional da Fase 2 aparece na interface sem quebrar a Fase 1 e sem transformar rota planejada em capacidade presumida.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define o escopo funcional.
- `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define entidades, validacoes e persistencia minima.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define as proibicoes estruturais.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define o que esta `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`.
- Este documento define apenas UI, blocos, mensagens, estados visuais e comportamento de tela.

## Principio geral
A Fase 2 adiciona contexto comunitario e de atribuicao sobre a venda da Fase 1 apenas onde houver prova runtime:
- Fase 1: loja publica vende produto publicado
- Fase 2: campanha, comunidade e afiliacao contextualizam a venda sem criar fluxo paralelo

## Leitura obrigatoria
- presenca em documento nao equivale a rota montada;
- quando a matriz marcar `NAO PRESUMIR`, a superficie deve ser tratada como intencao de fase, nao como mapa de implementacao;
- quando a matriz marcar `PARCIAL`, a UI deve deixar claro o limite atual da capacidade.

## Superficies reais do runtime atual
Publicas comprovadas:
- `/shop`
- `/product/[id]`
- `/c/[campaignId]` com entrada para vitrine contextual
- `/shop?campaignId=...` com vitrine filtrada por campanha ativa
- `/af/[slug]` para clique publico de afiliacao e redirect

Privadas comprovadas da comunidade:
- `/community`
- `/community/campaigns`
- `/community/campaigns/[id]`
- `/community/revenue`

Privadas comprovadas do afiliado:
- `/affiliate`
- `/affiliate/links`

Regra de UX para essas superficies:
- campanha ativa deve mostrar apenas itens realmente vinculados ao recorte publicado;
- `/community/campaigns/[id]` deve ser tratado como memoria operacional da campanha, com timeline, governanca, bloqueios e atribuicao leve no mesmo contrato do backend;
- afiliacao deve mostrar links, cliques, conversoes e receita atribuida sem chamar isso de saldo ou payout;
- `/community/revenue` pode detalhar receita por campanha, mas sempre como atribuicao composicional; payout continua agregado no owner ledger;
- nenhuma dessas telas pode insinuar `Organization` madura, membership formal ou reward financeiro proprio se o backend ainda nao sustenta isso.

## Superficies planejadas que nao podem ser presumidas
Publicas planejadas:
- `/@username`
- `/@username/campaigns/[campaignSlug]`
- `/@username/products/[productId]`
- `/@username/categories/[categorySlug]`

Privadas planejadas da comunidade:
- `/community/public-page`
- `/community/categories`
- `/community/campaigns/new`
- `/community/products`
- `/community/links`
- `/community/orders`
- `/community/buyers`
- `/community/settings`

Privadas planejadas do afiliado:
- `/affiliate/conversions`
- `/affiliate/rewards`
- `/affiliate/settings`

Regra de leitura:
- essas rotas descrevem intencao de fase;
- enquanto nao houver prova runtime correspondente, nao devem aparecer em navegacao, handoff ou checklist como se fossem base pronta.

## O que a UI nao deve prometer
- vitrine publica de `Organization` por username como capacidade pronta
- checkout paralelo de movimento
- PDP paralela para afiliado ou comunidade
- saldo, ledger ou payout financeiro proprio de afiliado
- portal autonomo de troca, login social inexistente ou outro atalho publico nao sustentado pelo runtime

## Reaproveitamento obrigatorio
- PDP contextualizada de campanha reaproveita a base de `/product/[id]` e adiciona apenas contexto comercial valido;
- vitrine contextualizada reaproveita `/shop` com filtro real;
- pedido, carrinho e checkout continuam sendo os mesmos da Fase 1.
