# Checkout/Payment Edge Cases Report

Data: 2026-05-23  
Owner: Frontend + Backend

## Escopo
Fluxo `shop -> product -> cart -> checkout -> success`, com foco em resiliência e coerência de contrato.

## Casos validados

1. Sessão ausente no checkout
- Esperado: interromper finalização e redirecionar para `/login`.
- Implementado: `CheckoutPageView` bloqueia `handleFinish` sem sessão.

2. Sessão expirada durante requisição
- Esperado: erro claro + redirecionamento seguro para login.
- Implementado: tratamento de `401/403` por `HttpRequestError` no checkout.

3. Conflito de estado (`409`)
- Esperado: mensagem orientando revisão do carrinho/estado.
- Implementado: mensagem específica para estado inválido.

4. Instabilidade de backend (`5xx`)
- Esperado: feedback claro e tentativa posterior, sem duplicar ação.
- Implementado: mensagem específica de instabilidade.

5. Clique duplo em pagamento
- Esperado: evitar criação duplicada.
- Implementado: botão de finalização depende de `isProcessing` + idempotência por `x-idempotency-key`.

## Coerência de contrato
- Checkout mantém uso de `POST /api/orders` e `POST /api/payments/checkout`.
- Chave de idempotência permanece obrigatória no envio do pagamento.
- Mensagens de erro agora refletem status HTTP sem quebrar shape de API.

## Risco residual
- Fluxo ainda depende de autenticação local temporária (até integração com IdP/SSO real).
- QA de domínio `payments` pode ser executado por gate moderado com exceção documentada quando necessário.
