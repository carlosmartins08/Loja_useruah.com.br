# Journey Matrix by Role

Data de revisao: 2026-06-18  
Owner: Produto + UX + Engenharia

## Objetivo
Garantir que cada papel execute suas acoes essenciais sem atrito, com regras de UX coerentes por ambiente.

## Visitor (nao autenticado)
- Objetivo: descobrir catalogo e iniciar compra com confianca.
- Acoes essenciais:
  - navegar em `/`, `/shop`, `/product/[id]`, `/category/[slug]`
  - adicionar item ao carrinho
  - iniciar checkout e ser redirecionado para login sem quebra
- Falhas criticas a evitar:
  - promo em contexto errado
  - bloqueio sem mensagem clara

## Customer
- Objetivo: comprar, acompanhar e resolver pendencias de pos-compra.
- Acoes essenciais:
  - login
  - checkout (`order -> payment`)
  - acompanhar status em `/account/orders`
  - abrir ticket de suporte em caso de problema
- Falhas criticas a evitar:
  - status inconsistente entre pagamento/producao/envio
  - mensagem transacional confusa

## Artist
- Objetivo: acompanhar impacto autoral sem espelhar a jornada do cliente.
- Acoes essenciais:
  - abrir `/artist` como home canonica
  - revisar portfolio em `/artist/portfolio`
  - acompanhar pedidos vinculados em `/artist/orders`
- Falhas criticas a evitar:
  - reaproveitar copy ou CTA da conta do cliente
  - ledger autoral responder com superficie bloqueada por papel

## Community Manager
- Objetivo: operar campanhas e receita da comunidade com ownership claro.
- Acoes essenciais:
  - abrir `/community` como home canonica
  - gerir campanhas em `/community/campaigns`
  - acompanhar ledger e payout em `/community/revenue`
- Falhas criticas a evitar:
  - campanha de outra comunidade aparecer na lista
  - dashboard apontar para jornada de cliente bloqueada

## Affiliate
- Objetivo: operar links e leitura de performance sem depender de namespace de cliente.
- Acoes essenciais:
  - abrir `/affiliate` como home canonica
  - consultar inventario em `/affiliate/links`
  - acessar politicas e diretrizes sem redirecionamento quebrado
- Falhas criticas a evitar:
  - dashboard apontar para `/account/*` ou superficie financeira bloqueada
  - CTA de divulgacao cair em namespace fora do papel

## Supplier
- Objetivo: operar carteira e producao sem escapar do ownership estrito.
- Acoes essenciais:
  - abrir `/supplier` como home canonica
  - revisar pedidos em `/supplier/orders`
  - operar fila em `/supplier/production`
- Falhas criticas a evitar:
  - ganho de visao global de producao por navegacao
  - pedido multi-supplier parecer mutavel pelo fornecedor

## Curator
- Objetivo: resolver fila editorial e encaminhar risco cross-role na superficie certa.
- Acoes essenciais:
  - abrir `/curation` como home canonica
  - revisar fila em `/curation/artworks`
  - acessar governanca em `/admin/impact-reviews`
- Falhas criticas a evitar:
  - tratar `/admin` como home do papel
  - misturar fila editorial com governanca operacional ampla

## Platform Admin
- Objetivo: configurar operacao sem dependencia de dev.
- Acoes essenciais:
  - abrir `/admin` como home canonica
  - gerir conectores de pagamento
  - definir gateway padrao e rollback
  - consultar trilha de auditoria
  - transitar por superficies operacionais canonicas sem depender de alias legado
- Falhas criticas a evitar:
  - acao critica sem rastreabilidade
  - necessidade de env flag para operacao de negocio

## Support Agent
- Objetivo: resolver chamados com contexto completo.
- Acoes essenciais:
  - abrir `/support` como home canonica
  - consultar `/support/tickets`
  - abrir contexto 360 por pedido
  - responder ticket com transicao correta
- Falhas criticas a evitar:
  - acesso a dados fora de escopo RBAC
  - resposta sem contexto de pedido/pagamento/envio

## Finance Admin
- Objetivo: decidir payout, reconciliacao e risco sem ambiguidade de superficie.
- Acoes essenciais:
  - abrir `/finance` como home canonica
  - executar fila de payout em `/finance/payouts`
  - revisar itens cross-role em `/admin/impact-reviews`
- Falhas criticas a evitar:
  - dashboard apontando para alias legado
  - decisao financeira sem trilha de risco

## Production Operator
- Objetivo: executar producao e envio com seguranca.
- Acoes essenciais:
  - abrir `/production` como home canonica
  - iniciar producao em estado valido
  - enviar pedido com tracking + carrier
  - registrar evento auditavel
- Falhas criticas a evitar:
  - transicao invalida sem bloqueio
  - envio sem rastreio
  - CTA do dashboard apontar para namespace bloqueado

## Evidencia minima ativa
- `npm run qa:role:journeys` deve provar:
  - home canonica por papel
  - uma rota secundaria acessivel
  - um CTA real do dashboard
  - uma rota indevida redirecionada ou bloqueada
- `npm run qa:role:closure` deve provar:
  - `artist` com autoria real chegando ao ledger
  - `community_manager` com campanha ativa chegando ao ledger
  - `affiliate` com referral publico chegando a snapshot e conversao automatica
- `npm run qa:base:roles` consolida a prova serial da base atual com gates de rota, blindspots e jornadas por papel.

## Regras transversais
- Mensagens operacionais devem priorizar clareza sobre marketing.
- Promocao/componente de comportamento nao aparece em ambiente operacional.
- Fallback obrigatorio para copy com variavel dinamica.
