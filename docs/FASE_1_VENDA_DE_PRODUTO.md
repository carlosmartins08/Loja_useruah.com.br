# Fase 1 - Venda de Produto

Data de revisao: 2026-06-03

## Objetivo
Fechar a primeira fase da plataforma com uma operacao vendavel, simples e coerente: o cliente compra no ecommerce e o admin master opera a loja de ponta a ponta.

## Regra de precedencia
Este documento e a fonte oficial da Fase 1.

Se houver conflito entre este documento e qualquer roadmap, tracking historico, checklist ou nota operacional mais antiga, prevalece este documento.

## Definicao executiva da fase
Na Fase 1 existem apenas dois atores operacionais ativos:
- `customer`
- `admin_master`

Tudo que nao for necessario para vender, receber pedido, acompanhar pagamento, registrar envio e responder suporte fica fora do escopo ativo da fase.

## Objetivo de negocio
Colocar a operacao minima de venda no ar para girar investimento com o menor risco de retrabalho.

Metrica principal:
- 1 compra ponta a ponta reproduzivel em ambiente controlado

Metricas de confirmacao:
- produto publicado visivel no ecommerce
- checkout sandbox concluido sem duplicidade
- pedido com snapshot congelado
- envio/rastreio refletido para o cliente
- suporte basico funcionando

## Escopo ativo

### Ecommerce publico
- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- paginas institucionais minimas para venda

### Area do cliente
- `/account`
- `/account/addresses`
- `/account/orders`
- `/account/wallet` fica fora da prova de fase
- acompanhamento de pedido
- status do pedido
- rastreio
- suporte basico

### Area administrativa
- `/admin`
- operacao centralizada pelo `admin_master`
- cadastro e publicacao de produto
- acompanhamento de pedido
- acompanhamento de pagamento
- registro de envio/rastreio
- resposta de suporte

### Dominios obrigatorios
- `CatalogItem` publicado
- carrinho
- `Order`
- `OrderItemSnapshot`
- `Payment` em sandbox
- `Shipment`
- `Ticket`
- `AuditLog` em acoes criticas

## Escopo fora da fase
- `artist`
- `community_manager`
- `affiliate`
- campanhas
- `supplier` com painel proprio
- curadoria externa
- payout avancado
- commission ledger como funcionalidade ativa de negocio
- links rastreaveis
- `/@username`
- qualquer fluxo coletivo

Arquitetura pode permanecer preparada para evolucao futura, mas essas capacidades nao podem dirigir a execucao atual nem bloquear a entrega da fase.

## Regras operacionais

### Regra 1 - produto vendido
O cliente compra apenas `CatalogItem` publicado.

### Regra 2 - snapshot obrigatorio
Toda compra deve gerar `OrderItemSnapshot` para congelar o que foi comprado.

Campos minimos esperados:
- `catalogItemId`
- `productName`
- `productDescription`
- `selectedColor`
- `selectedSize`
- `unitPricePaid`
- `freightCost`
- `imageUrl`
- `createdAt`

Campos internos adicionais podem existir, desde que nao quebrem essa funcao de congelamento.

### Regra 3 - visibilidade do cliente
O cliente nao pode ver:
- custo interno
- margem
- fornecedor interno
- tabelas internas
- trilha administrativa completa
- entidades tecnicas como `ProductionJob`, `CommissionLedger` e `Payout`

### Regra 4 - visibilidade do admin
O `admin_master` deve conseguir operar:
- cadastro de insumos minimos de produto
- publicacao do catalogo
- pedidos
- pagamentos
- envios
- suporte

### Regra 5 - traducao de estado
O cliente nao deve enxergar enum tecnico bruto quando houver traducao de status mais adequada na interface.

## Fluxo mestre da fase
1. `admin_master` prepara e publica um `CatalogItem`
2. `customer` visualiza o produto no ecommerce
3. `customer` adiciona ao carrinho
4. `customer` conclui checkout sandbox
5. sistema cria `Order` e `OrderItemSnapshot`
6. pagamento confirma o pedido
7. `admin_master` acompanha e registra envio
8. `customer` acompanha status e rastreio em `/account`
9. suporte basico atende ocorrencias do pedido

Esse e o fluxo que define o sucesso da Fase 1. Tudo que nao fortalece esse fluxo deve ser tratado como backlog.

## Gate de aceite P0
- `P0-F1-01` admin acessa `/admin`
- `P0-F1-02` cliente acessa `/account`
- `P0-F1-03` admin publica produto vendavel
- `P0-F1-04` produto publicado aparece no ecommerce
- `P0-F1-05` cliente ve produto sem custo, margem ou fornecedor interno
- `P0-F1-06` cliente adiciona produto ao carrinho
- `P0-F1-07` cliente finaliza compra
- `P0-F1-08` `OrderItemSnapshot` e gerado
- `P0-F1-09` cliente acompanha pedido em `/account`
- `P0-F1-10` cliente nao acessa pedido de outro usuario
- `P0-F1-11` admin acompanha pedidos
- `P0-F1-12` admin registra rastreio/envio
- `P0-F1-13` cliente ve rastreio quando disponivel
- `P0-F1-14` suporte basico funciona
- `P0-F1-15` acoes criticas deixam rastro em `AuditLog`
- `P0-F1-16` `npm run check` passa
- `P0-F1-17` `npm run build` passa
- `P0-F1-18` `npm run qa:functional` passa

## Ordem oficial de execucao
1. Catalogo vendavel
2. Carrinho e checkout
3. Pedido e snapshot
4. Status, envio e rastreio
5. Suporte basico
6. Hardening de RBAC e ocultacao de dados internos
7. Gate final de aceite

## Regra anti-retrabalho
- Nao abrir nova frente se o fluxo mestre ainda nao passou.
- Nao desenvolver fase futura para "ja deixar pronto" se isso atrasar a fase atual.
- Nao criar novo documento de fase sem atualizar explicitamente a precedencia em `docs/EXECUTION_CONSOLIDATED_MASTER.md`.
- Nao chamar de concluido o que nao tiver evidencia executavel.

## Definicao de pronto
A Fase 1 so esta fechada quando:
- o fluxo mestre roda sem quebra
- os itens P0 acima estao validados
- os gates tecnicos passam
- a operacao nao depende de interpretar documentos conflitantes
