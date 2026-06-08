# Fase 1 - Matriz de Execucao

Data de revisao: 2026-06-03

## Objetivo
Traduzir `docs/FASE_1_VENDA_DE_PRODUTO.md` em uma sequencia de execucao sem retrabalho, com WIP controlado e criterio objetivo de fechamento.

## Regra de uso
- Executar um bloco por vez.
- Nao iniciar bloco seguinte sem evidenciar o anterior.
- Item marcado como `PARCIAL` tem prioridade sobre item `PLANEJADO` e `AUSENTE`.
- Item fora do fluxo mestre nao entra no sprint da Fase 1.

## Legenda
- `IMPLEMENTADO`: implementado com evidencia razoavel
- `PARCIAL`: existe, mas precisa auditoria, ajuste ou prova
- `PLANEJADO`: previsto formalmente, mas ainda sem evidencia suficiente para ser tratado como base real
- `AUSENTE`: nao ha evidencia suficiente para considerar ativo

Regra de leitura:
- item fora do escopo ativo da Fase 1 deve ser lido como `PLANEJADO` para fase futura ou `AUSENTE` quando ainda nao houver base suficiente no runtime

## Bloco 1 - Catalogo vendavel

### Objetivo
Garantir que o admin consegue publicar um produto e que esse produto aparece corretamente no ecommerce.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| Acesso do admin a `/admin` | IMPLEMENTADO | `/admin` existe, e `platform_admin` passa a ser o `admin_master` operacional explicito da Fase 1 na interface admin | validar jornada real completa |
| Publicacao de `CatalogItem` | IMPLEMENTADO | APIs de criar, marcar `ready`, publicar, despublicar e bootstrap existem e agora ha superficie operacional em `/admin/catalog` | validar prova funcional ponta a ponta com item real |
| Produto publicado aparece no ecommerce | IMPLEMENTADO | `/shop` lista apenas `published` e `/product/[id]` bloqueia item nao publicado | validar prova funcional ponta a ponta com item real |
| Cliente nao ve custo, margem e fornecedor interno | IMPLEMENTADO | shop e PDP mapeiam campos publicos e `GET /api/catalog-items` para nao gestores agora devolve apenas payload publico de itens publicados | validar prova funcional ponta a ponta com inspecao de resposta |

### Gate de saida
- admin publica um item vendavel
- item aparece em `/shop`
- PDP carrega sem dados internos

## Bloco 2 - Carrinho e checkout

### Objetivo
Garantir que o cliente consegue selecionar produto e concluir checkout sandbox sem duplicidade.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| Carrinho funcional | IMPLEMENTADO | `qa:functional` em `start` validou navegacao real `shop -> cart -> checkout` com CTA ativo e selecao de item | manter como regressao no fechamento |
| Checkout sandbox | IMPLEMENTADO | `qa:coreops` validou `order -> checkout -> webhook approved` com pedido pago e fluxo operacional subsequente | manter como regressao no fechamento |
| Idempotencia de checkout | IMPLEMENTADO | `qa:coreops` repetiu `POST /api/payments/checkout` com a mesma `x-idempotency-key` e preservou o mesmo `paymentId` com `reused=true` | manter como regressao no fechamento |

### Gate de saida
- cliente adiciona produto ao carrinho
- checkout cria pedido sem duplicidade
- pagamento sandbox conclui com status coerente

## Bloco 3 - Pedido e snapshot

### Objetivo
Garantir que a venda gera pedido consistente e congelado.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| `Order` criado no checkout | IMPLEMENTADO | `qa:coreops` validou criacao de pedido em `placed`, aprovacao de pagamento e continuidade do fluxo com o mesmo `orderId` | manter como regressao no fechamento |
| `OrderItemSnapshot` gerado | IMPLEMENTADO | `Order.items` agora assume explicitamente o contrato oficial de snapshot, com `snapshotVersion`, nome, imagem e variante congelados no momento da compra, e as superficies do cliente leem esse dado fixado | manter inspeção de payload como regressao |
| Cliente nao acessa pedido de outro usuario | IMPLEMENTADO | `qa:coreops` validou `GET /api/orders/:id/status` com outro `customer` retornando `403` | manter como regressao no fechamento |

### Gate de saida
- pedido e criado
- snapshot fica congelado
- acesso cruzado retorna `403` ou equivalente

## Bloco 4 - Status, envio e rastreio

### Objetivo
Garantir que a operacao fecha o ciclo minimo de acompanhamento do pedido.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| Admin acompanha pedidos | IMPLEMENTADO | a fila de producao agora esta protegida por RBAC e opera como superficie minima de acao para o fluxo ativo | validar jornada real de ponta a ponta |
| Admin registra envio/rastreio | IMPLEMENTADO | backend de `start` e `ship` existe com auditoria e a tela de producao agora permite iniciar producao e registrar envio com transportadora e rastreio | validar jornada real de ponta a ponta |
| Cliente ve status em `/account` | IMPLEMENTADO | a conta agora possui detalhe canonico por pedido consumindo `/api/orders/:id/status` | validar jornada real de ponta a ponta |
| Cliente ve rastreio | IMPLEMENTADO | a conta exibe rastreio real quando existir e a pagina de sucesso deixou de usar numero e link ficticios | validar jornada real de ponta a ponta |

### Gate de saida
- envio registrado pelo admin
- status e rastreio aparecem para o cliente

## Bloco 5 - Suporte basico

### Objetivo
Garantir o minimo de atendimento ao pedido sem abrir novos dominios.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| Cliente abre ticket do proprio pedido | IMPLEMENTADO | `qa:coreops` validou `POST /api/tickets` para pedido enviado | manter como regressao no fechamento |
| Suporte responde ticket | IMPLEMENTADO | `qa:coreops` validou `POST /api/tickets/:id/reply` com papel de suporte | manter como regressao no fechamento |
| Ticket nao altera estado operacional por acidente | IMPLEMENTADO | `qa:coreops` respondeu o ticket e o contexto consolidado preservou `order.status = shipped` | manter como regressao no fechamento |

### Gate de saida
- ticket abre
- suporte responde
- estados de pedido, pagamento e envio nao sofrem efeito colateral

## Bloco 6 - Hardening final

### Objetivo
Blindar a fase contra vazamento de escopo, dados internos e regressao basica.

| Item | Status inicial | Evidencia atual | Proxima acao |
| --- | --- | --- | --- |
| RBAC minimo entre `customer` e `admin_master` | PARCIAL | ha RBAC multi-role no sistema | simplificar criterio da fase |
| Traducao de estados tecnicos para cliente | PARCIAL | regra definida, prova difusa | revisar UI de status |
| `AuditLog` em acoes criticas | PARCIAL | tracking mostra evidencias por dominio | consolidar no fluxo mestre |
| Gates tecnicos | PARCIAL | historico PASS existe | rerodar no fechamento oficial |

### Gate de saida
- cliente nao ve superficie interna
- acoes criticas deixam trilha
- gates tecnicos passam

## Fora da fase
- `artist`
- `community_manager`
- `affiliate`
- `supplier` com painel proprio
- campanhas
- payout avancado
- commission ledger como funcionalidade de negocio
- qualquer feature que nao acelere o fluxo mestre

## Sequencia oficial de execucao
1. auditar `PARCIAL` do bloco 1
2. fechar bloco 1
3. auditar `PARCIAL` do bloco 2
4. fechar bloco 2
5. repetir ate o bloco 6

## Gate final de fechamento
- `npm run check`
- `npm run build`
- `npm run qa:functional`
- prova manual ou automatizada de 1 compra ponta a ponta
- checklist P0 de `docs/FASE_1_VENDA_DE_PRODUTO.md` fechado
