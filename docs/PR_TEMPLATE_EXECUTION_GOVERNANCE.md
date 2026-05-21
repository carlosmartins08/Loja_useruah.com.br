# PR Template - Execution Governance (Obrigatorio)

Use este template em todo PR que altere fluxo, estado, contrato, permissao ou comportamento operacional.

## 0) Classificacao de mudanca (COBIT/ITIL)
- Tipo de mudanca:
  - [ ] `standard` (baixo risco, procedimento conhecido)
  - [ ] `normal` (avaliacao completa obrigatoria)
  - [ ] `emergency` (restauracao urgente, RCA obrigatorio pos-merge)
- Janela de risco:
  - [ ] baixa
  - [ ] media
  - [ ] alta
- Existe incidente ativo relacionado?
  - [ ] Nao
  - [ ] Sim (informar ID/titulo):

## 1) Contexto e objetivo
- Problema que este PR resolve:
- Resultado esperado:
- Dominio principal afetado (escolha 1):
  - [ ] Pagamentos
  - [ ] Pedidos/Logistica
  - [ ] Catalogo/Curadoria
  - [ ] Suporte/Tickets
  - [ ] RBAC/Permissoes
  - [ ] UI/Rotas

## 2) Fonte unica consultada (obrigatorio)
- Documento fonte do dominio (link/caminho):
- Se houver divergencia encontrada, qual decisao foi adotada:
- Referencia ao consolidado: `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Referencia de baseline de controle: `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`

## 3) Mudanca de estado/contrato
- Este PR altera estado canonico?
  - [ ] Nao
  - [ ] Sim (descrever transicao e justificativa)
- Este PR altera contrato de API/campos?
  - [ ] Nao
  - [ ] Sim (descrever migration e compatibilidade)
- Backward compatibility preservada?
  - [ ] Sim
  - [ ] Nao (justificar)

## 4) Seguranca e governanca
- RBAC validado no backend:
  - [ ] Sim
  - [ ] Nao se aplica
- AuditLog para acao critica:
  - [ ] Sim
  - [ ] Nao se aplica
- Idempotencia aplicavel (pagamentos/webhook/eventos repetidos):
  - [ ] Sim
  - [ ] Nao se aplica

## 5) Evidencias de validacao
- [ ] `npm run alert:critical` executado no inicio do ciclo/PR
- [ ] `npm run check` passou
- [ ] Fluxo funcional principal testado
- [ ] Fluxo de erro/edge-case testado
- Evidencias (prints/logs/sumario):

## 6) Checklist integrado de frontend (quando aplicavel)
- [ ] Todos os `href` alterados apontam para rotas existentes em `app/`.
- [ ] Fluxo principal validado manualmente: `home -> shop -> product -> cart -> checkout`.
- [ ] Metadata/SEO coerentes (`sitemap`, `robots`, JSON-LD) quando houver mudanca de rota/indexacao.
- [ ] Acessibilidade minima validada (semantica, teclado, foco, `alt`).
- [ ] Responsividade validada em mobile (>=360px), tablet e desktop.
- [ ] Sem overflow horizontal nao intencional.
- [ ] Checkout/pagamentos mantiveram contrato compativel e `x-idempotency-key`.
- [ ] Webhook manteve validacao de assinatura (`x-signature`) quando segredo existir.
- [ ] Se alterou PDP ou checkout, anexou evidencia visual desktop + mobile.
- [ ] Se alterou pagamento, anexou evidencia de 1 sucesso sandbox + 1 falha sandbox.

## 7) Impacto por camada
- Frontend:
- Backend/API:
- Dados/entidades:
- Observabilidade/eventos:

## 8) Risco e rollback (COBIT BAI06 / APO12)
- Risco principal da mudanca:
- Efeito esperado se falhar:
- Plano de rollback objetivo:
- Criterio de backout (quando reverter):

## 9) Checklist anticonflito (gate)
- [ ] Nao dupliquei regra em documento paralelo.
- [ ] Atualizei apenas o documento fonte do dominio afetado.
- [ ] Se alterei regra global, atualizei `docs/EXECUTION_CONSOLIDATED_MASTER.md`.
- [ ] Se alterei rota/UI, alinhei `docs/ROUTE_DEFINITION_OF_DONE.md`.
- [ ] Se alterei criterio de PR, alinhei este template e o baseline COBIT/ITIL.

## 10) Pos-merge (ITIL incidente/problema)
- [ ] Nenhuma pendencia
- [ ] Listar follow-ups com owner e prazo
- [ ] Se `emergency`, abrir RCA com causa raiz e acao preventiva
