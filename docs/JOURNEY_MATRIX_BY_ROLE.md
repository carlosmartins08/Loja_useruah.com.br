# Journey Matrix by Role

Data de revisao: 2026-05-24  
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

## Platform Admin
- Objetivo: configurar operacao sem dependencia de dev.
- Acoes essenciais:
  - gerir conectores de pagamento
  - definir gateway padrao e rollback
  - consultar trilha de auditoria
- Falhas criticas a evitar:
  - acao critica sem rastreabilidade
  - necessidade de env flag para operacao de negocio

## Support Agent
- Objetivo: resolver chamados com contexto completo.
- Acoes essenciais:
  - consultar `/admin/support`
  - abrir contexto 360 por pedido
  - responder ticket com transicao correta
- Falhas criticas a evitar:
  - acesso a dados fora de escopo RBAC
  - resposta sem contexto de pedido/pagamento/envio

## Production Operator
- Objetivo: executar producao e envio com seguranca.
- Acoes essenciais:
  - iniciar producao em estado valido
  - enviar pedido com tracking + carrier
  - registrar evento auditavel
- Falhas criticas a evitar:
  - transicao invalida sem bloqueio
  - envio sem rastreio

## Regras transversais
- Mensagens operacionais devem priorizar clareza sobre marketing.
- Promocao/componente de comportamento nao aparece em ambiente operacional.
- Fallback obrigatorio para copy com variavel dinamica.
