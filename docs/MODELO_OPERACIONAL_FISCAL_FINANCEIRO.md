# Modelo Operacional, Fiscal e Financeiro da Plataforma

Data de revisao: 2026-05-21

## Objetivo
Definir o modelo oficial de operacao com quatro papeis:
- consumidor final
- industria/fabricante
- artista/licenciante
- plataforma

O objetivo desta base e manter coerencia entre contrato, backend, split financeiro, licenciamento criativo e governanca de release.

## Tese operacional oficial
- A plataforma atua como intermediadora digital de comercializacao e licenciamento criativo.
- A industria permanece responsavel por produto fisico, fabricacao e entrega.
- O artista licencia uso comercial da arte aplicada no produto.
- O consumidor compra no ambiente digital da plataforma.

## Fluxo operacional
1. Industria publica produto apto para personalizacao.
2. Artista publica arte para licenciamento.
3. Consumidor escolhe produto + arte.
4. Sistema gera pedido e decomposicao financeira por item.
5. Pagamento e processado no provedor.
6. Split interno registra valores de plataforma, industria e artista.
7. Evento de licenciamento registra uso da arte por item vendido.
8. Industria produz/entrega conforme operacao.

## Regras financeiras minimas por item
- `gross_item_amount`
- `supplier_amount`
- `artist_license_amount`
- `platform_commission_amount`
- `gateway_fee_amount`
- `shipping_amount`
- `tax_reserve_amount`
- `supplier_net_amount`
- `artist_net_amount`
- `platform_net_amount`

## Regras obrigatorias de release para pagamentos reais
1. Termos base aceitos por industria, artista e consumidor.
2. Split por item persistido e auditavel.
3. Evento de licenciamento gerado para venda com arte.
4. Webhook com idempotencia validado.
5. Rollback operacional testado.
6. Fluxo fiscal validado com contador/tributarista antes de producao real.

## Escopo desta fase (base enxuta)
- Sem mudar contrato publico atual de API.
- Novas entidades internas: `payment_splits`, `license_events`, `terms_acceptances`.
- Persistencia com padrao atual: MySQL + fallback local.
