# Blind Spot Closure Checklist (GO/NO-GO)

Data de referência: 28/05/2026  
Escopo: liberar produção comercial com risco controlado.

## Regra de decisão
- `GO`: 100% dos itens críticos concluídos com evidência.
- `GO condicionado`: no máximo 1-2 itens não críticos pendentes, com owner e prazo D+2.
- `NO-GO`: qualquer item crítico sem evidência.

## 1) Infra e domínio (Crítico)
- [ ] Domínio principal apontando para o app (`useruah.com.br`) validado.
- [ ] Subdomínio de conteúdo/blog (`blog.useruah.com.br`) validado.
- [ ] SSL/TLS válido e renovação automática ativa.
- [ ] Redirecionamentos 301 definidos (sem loop).
- Evidência:
  - Print de DNS e certificado.
  - `curl -I` dos domínios com status esperado.

## 2) Pagamentos e webhook público (Crítico)
- [ ] Endpoint público de webhook Stripe ativo e respondendo `2xx`.
- [ ] Assinatura (`whsec`) correta em produção.
- [ ] Idempotência confirmada para evento duplicado.
- [ ] Fluxo `checkout -> paid -> produção` confirmado no domínio final.
- Evidência:
  - Logs Stripe + logs da aplicação para `payment_intent.succeeded` e `payment_intent.payment_failed`.
  - Pedido real de teste com trilha completa.

## 3) Persistência e banco (Crítico)
- [ ] `PAYMENT_PERSISTENCE=mysql` ativo em produção.
- [ ] `DATABASE_URL` com credencial gerenciada e backup.
- [ ] Migração aplicada para campos novos de catálogo (incluindo `pricing_policy_json`).
- [ ] Plano de rollback de schema documentado.
- Evidência:
  - Saída de validação de conexão.
  - Comando de migração executado + timestamp.

## 4) Matriz de cadastro e governança (Crítico)
- [ ] Cadastro usuário bloqueia avanço de status sem matriz completa.
- [ ] Cadastro produto bloqueia publicação fora de regra (arte/aplicabilidade/preço mínimo).
- [ ] Auditoria de matriz sem inconsistências críticas (`/api/admin/matrix-audit`).
- Evidência:
  - Resultado da rota de auditoria.
  - Casos de teste com bloqueio e aprovação válidos.

## 5) Operação de pedido (Crítico)
- [ ] Pedido persiste `supplierId` e endereço final de entrega.
- [ ] Status coerente entre `order`, `payment`, `production`, `shipment`.
- [ ] Fornecedor recebe job completo e rastreável.
- Evidência:
  - Ordem de teste com trilha completa até `shipped`.
  - Logs de auditoria por transição.

## 6) Financeiro e repasse (Crítico)
- [ ] Janela de segurança de repasse ativa (`PAYOUT_SECURITY_WINDOW_DAYS`).
- [ ] Conciliação de payout e comissão sem divergência.
- [ ] Fluxos de refund/chargeback validados.
- Evidência:
  - Resultado dos testes de payout ledger.
  - Registro de reconciliação por `providerReference`.

## 7) Segurança e acesso (Crítico)
- [ ] RBAC ativo para rotas administrativas/sensíveis.
- [ ] Segredos fora de código e rotacionáveis.
- [ ] Logs de auditoria habilitados para ações críticas.
- Evidência:
  - Tentativa de acesso indevido bloqueada (`403`) em produção.
  - Lista de variáveis sensíveis por ambiente.

## 8) Observabilidade e resposta (Crítico)
- [ ] Alertas de erro 5xx e falhas de webhook ativos.
- [ ] Dashboard mínimo de saúde (pagamento, produção, envio).
- [ ] Runbook de incidente com responsáveis e canais.
- Evidência:
  - Print/URL dos alertas.
  - Simulação simples de incidente e resposta.

## 9) Performance e estabilidade (Não crítico, mas recomendado antes do tráfego)
- [ ] Smoke de carga básico no checkout e webhook.
- [ ] Tempo de resposta dentro do alvo em rotas críticas.
- Evidência:
  - Relatório curto de latência e erro.

## 10) Conteúdo e comunicação (Não crítico)
- [ ] Políticas públicas revisadas (troca/privacidade/termos).
- [ ] Mensagens de erro de checkout claras para suporte.
- Evidência:
  - URLs publicadas e revisão final.

## Gate Final (preencher)
- Data/hora do gate:
- Decisão: `GO` | `GO condicionado` | `NO-GO`
- Pendências abertas (se houver):
- Owner por pendência:
- Prazo:
- Responsável pela aprovação final:
