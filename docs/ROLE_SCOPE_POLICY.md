# Role Scope Policy

Data de revisao: 2026-05-28

## Regra-mãe
- Frontend exibe apenas o que o papel precisa operar.
- Backend autoriza apenas o que o papel pode executar.
- Toda acao critica deve registrar `AuditLog` com `actor_id`, `actor_role`, `action`, `entity_id`, `reason`.

## Escopo por papel

### `customer`
- Vê: catalogo, checkout, pedidos proprios, rastreio, tickets proprios.
- Nao vê: margem, custo fornecedor, pedidos de terceiros, suporte 360.
- Pode: comprar, abrir ticket, acompanhar pedido.
- Nao pode: alterar status operacional, acessar financeiro interno.

### `artist`
- Vê: artes proprias, curadoria, produtos vinculados, comissoes proprias.
- Nao vê: margem interna, dados de outros artistas, pedidos globais.
- Pode: enviar/ajustar arte, acompanhar comissao.
- Nao pode: autoaprovar arte, mudar preco final.

### `community_manager`
- Vê: campanhas proprias, metas, desempenho e arrecadacao vinculada.
- Nao vê: campanhas de terceiros, margem global, dados sensiveis.
- Pode: criar e operar campanha propria.
- Nao pode: autoaprovar campanha, alterar regra global.

### `supplier`
- Vê: produtos base/ficha tecnica, producao vinculada, envios e rastreio.
- Nao vê: margem da plataforma, comissao de artista/grupo, dados globais.
- Pode: operar producao/envio no proprio escopo.
- Nao pode: alterar preco publico direto, aprovar payout.

### `curator`
- Vê: fila de artes e campanhas pendentes de curadoria.
- Nao vê: dados bancarios, payout e margem detalhada.
- Pode: aprovar/rejeitar arte e campanha com motivo.
- Nao pode: executar fluxo financeiro.

### `production_operator`
- Vê: jobs de producao, pedidos pagos vinculados, shipment e ocorrencias.
- Nao vê: margem, comissao e ledger financeiro.
- Pode: iniciar producao, atualizar status, gerar envio/rastreio.
- Nao pode: alterar pagamento, refund, payout.

### `support_agent`
- Vê: tickets e contexto 360 operacional do pedido.
- Nao vê: margem, dados bancarios, comissao detalhada.
- Pode: diagnosticar e encaminhar.
- Nao pode: atalho para alterar pagamento/producao fora do fluxo.

### `finance_admin`
- Vê: payments, ledger, payout, refund, chargeback, conciliacao.
- Nao vê (como acao): curadoria de arte/campanha e operacao de producao.
- Pode: reconciliar e decidir fluxo financeiro.
- Nao pode: atuar como curadoria/producao.

### `platform_admin`
- Vê: visao global.
- Pode: governanca e excecoes.
- Nao pode: atuar sem `AuditLog` e sem justificativa em acao critica.

### `affiliate`
- Vê: links, cliques, conversoes e recompensas proprias.
- Nao vê: dados de cliente, margem interna, producao e financeiro sensivel.
- Pode: divulgar e acompanhar performance.
- Nao pode: acesso a dados privados e autoindicacao fraudulenta.

## Excecoes de negocio
- Fornecedor homologado via API pode atualizar disponibilidade/producao/rastreio.
- Campos sensiveis (preco, prazo, frete, campanha ativa) podem exigir `pending_impact_review`.
- `requested` em payout nunca equivale a `paid`.
