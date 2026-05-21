# MVP Roadmap (Anti-Retrabalho)

## Objetivo
Executar o MVP por fases sem duplicar regra entre perfis, priorizando receita, estabilidade operacional e governança.

## Princípios
- Primeiro construir camada compartilhada; depois superfícies específicas por perfil.
- Evitar lógica duplicada em telas diferentes para o mesmo comportamento.
- Toda fase fecha com critérios de aceite objetivos.

## Decisao ativa: Payment Deferred
- Ativo em 2026-05-19: gateway real e persistência financeira ficam para fase posterior.
- Durante o MVP de produto, checkout opera em modo sandbox com contrato congelado.
- Proibido quebrar compatibilidade dos campos: `paymentId`, `orderId`, `providerReference`, `status`, `method`, `amount`, `currency`.
- Idempotência (`x-idempotency-key`) e assinatura de webhook (`x-signature`) permanecem obrigatórias.

## Fase 1: Fundação
### Escopo
- RBAC com 9 perfis oficiais.
- `Organization` multi-tipo (`artist`, `community`, `supplier`).
- Máquina de estados canônica:
  - Pedido: `draft -> placed -> paid -> in_production -> shipped -> delivered -> closed`
  - Arte: `submitted -> under_review -> approved|rejected`
  - Saque: `requested -> approved -> paid|rejected`
- `AuditLog` para ações críticas.

### Critérios de aceite
- Permissões respeitadas por rota e por ação.
- Estado não pode pular etapas inválidas.
- Toda ação crítica deixa rastro em `AuditLog`.

## Fase 2: Checkout operacional (Sandbox estável)
### Escopo
- Checkout funcional (criação de pedido + pagamento sandbox).
- Webhook de confirmação no contrato atual.
- Idempotência de pedido/cobrança no contrato atual.
- Fluxo operacional mínimo `paid -> in_production -> shipped`.
- Atendimento com visão 360 de pedido.

### Critérios de aceite
- 10 compras sandbox sem inconsistência.
- Duplo clique não duplica pedido/cobrança.
- Webhook atrasado não quebra conciliação.

## Fase 2.1: Pagamento real e persistência financeira
### Escopo
- Integrar gateway real via adapter (tokenização, antifraude e captura).
- Persistir transações em banco com reconciliação idempotente por `providerReference`.
- Validação de webhook por assinatura por ambiente.
- Observabilidade mínima de pagamento (log estruturado + trilha de erro).

### Critérios de aceite
- Compra real homologada ponta a ponta em ambiente de teste do provedor.
- Reprocessamento de webhook não duplica efeito financeiro.
- Falha de provedor retorna fallback seguro sem perda de pedido.

## Fase 3: Catálogo escalável (Artista + Curadoria)
### Escopo
- Upload de arte e submissão.
- Mockup e vínculo arte-produto.
- Fila de curadoria com aprovação/rejeição e motivo.
- Publicação no catálogo após aprovação.

### Critérios de aceite
- Arte reprovada não pode ser publicada.
- Motivo de reprovação obrigatório.
- Histórico de revisão auditável.

## Fase 4: Comunidade e campanhas
### Escopo
- Página institucional de grupo/pastoral.
- Campanhas com metas e produtos vinculados.
- Link público de campanha.
- Comissão por campanha no ledger.

### Critérios de aceite
- Venda via campanha gera rastreio de origem.
- Comissão da campanha calculada corretamente.
- Dashboard da campanha reflete dados reais.

## Fase 5: Financeiro e comissionamento
### Escopo
- Ledger único de movimentação.
- Saques (`requested -> approved -> paid`).
- Estornos, cancelamentos e reconciliação.
- Relatórios de margem e repasses.

### Critérios de aceite
- Fechamento financeiro reproduzível.
- Estorno reflete no saldo correto.
- Nenhum repasse sem trilha de aprovação.

## Fase 6: Governança de plataforma
### Escopo
- Painel global (KPI de receita, operação e risco).
- Gestão avançada de políticas e permissões.
- Moderação superior e ações administrativas críticas.

### Critérios de aceite
- Ações de alto risco com autorização explícita.
- Alterações de política versionadas.
- Alertas operacionais mínimos configurados.

## Shared vs Specific (Regra prática)
### Shared (uma vez só)
- Pedido, pagamento, webhook, comissão, rastreio, ticket, auditoria.

### Specific (por perfil)
- UX por perfil, filtros, dashboards e atalhos operacionais.

## Gate de qualidade por fase
- `npm run check`
- `npm run build`
- `npm run qa:functional`
- Critérios de negócio da fase (tabela acima)

Documento de apoio operacional: docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md

Documento de apoio de catálogo e curadoria: docs/CATALOG_CURATION_DEFINITION_OF_DONE.md

Documento de apoio de atendimento e tickets: docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md

Governança de conflitos e fonte única: docs/EXECUTION_CONSOLIDATED_MASTER.md

Histórico de decisões arquiteturais: docs/CHANGELOG_GOVERNANCE.md
