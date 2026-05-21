# Execution Operating Template (Anti-retrabalho)

Data de revisao: 2026-05-21

## Objetivo
Executar com foco, sem tarefa incompleta e sem conflito entre documentação e código.

## Como usar
1. Escolher 1 domínio ativo da semana (WIP 1), conforme `docs/EXECUTION_CONSOLIDATED_MASTER.md`.
2. Planejar até 10 itens pequenos (cada item com entrega verificável em 1-2 dias).
3. Executar um item por vez usando o cartão operacional abaixo.
4. Fechar a semana atualizando status matrix e changelog.

## Cartão operacional único (copiar e preencher)

### 1) Escopo
- Título:
- Domínio:
- Owner:
- Prazo:
- Problema real:
- Resultado esperado:
- Fora de escopo (obrigatório):

### 2) Fonte única (obrigatório)
- Documento fonte do domínio:
- Trecho/ seção usada:
- Estado canônico aplicado (`docs/STATE_MACHINES.md`):
- Contrato/API afetado (`docs/API_CONTRACTS.md`):

### 3) Definição de pronto (obrigatório)
- [ ] Código implementado
- [ ] Critério de aceite do domínio atendido
- [ ] Teste funcional do fluxo principal passou
- [ ] Teste de erro/edge-case passou
- [ ] Evidência registrada (print/log)
- [ ] Documentação sincronizada

### 4) 6 gates de execução (bloqueia avanço se falhar)
- Gate 1 — Domínio único: item não mistura domínios.
- Gate 2 — Estado: transição respeita máquina de estados.
- Gate 3 — Contrato: entrada/saída e compatibilidade claros.
- Gate 4 — Segurança: RBAC e AuditLog quando aplicável.
- Gate 5 — Qualidade: P0 aplicável do `docs/QA_ACCEPTANCE_TESTS.md`.
- Gate 6 — Documentação: docs de fonte + status atualizados.

### 5) Evidências mínimas
- Arquivos alterados:
- Endpoints testados:
- Resultado dos testes:
- Risco residual:
- Plano de rollback:

### 6) Fechamento
- Status final: `EXISTE | PARCIAL | AUSENTE`
- Atualizações obrigatórias feitas:
  - [ ] `docs/EXECUTION_STATUS_MATRIX.md`
  - [ ] documento de domínio
  - [ ] `docs/CHANGELOG_GOVERNANCE.md` (se decisão)

## Ritual semanal fixo
- Segunda: escolher domínio + top 10 itens + classificar `EXISTE/PARCIAL/AUSENTE`.
- Terça a quinta: executar blocos pequenos, 1 PR por bloco, sem PR misto.
- Sexta: reconciliar docs x código + atualizar matriz + registrar decisões.

## Bloco obrigatório de reconciliação (docs x código)
Rodar antes de fechar semana:

```powershell
rg --files app/api
rg -n "AUSENTE|PARCIAL|EXISTE" docs/EXECUTION_STATUS_MATRIX.md
rg -n "getMockProduct|readStoreFile|writeStoreFile|idempotency|webhook|AuditLog" app lib components
```

Se houver conflito entre o que a matriz diz e o que o código mostra:
- atualizar `docs/EXECUTION_STATUS_MATRIX.md` no mesmo ciclo
- registrar decisão em `docs/CHANGELOG_GOVERNANCE.md` se houver mudança de interpretação

## Pontas soltas já detectadas (2026-05-21)
1. `docs/EXECUTION_STATUS_MATRIX.md` marca pedidos/logística backend como ausente, mas já existem APIs de pedido/produção/envio.
2. O mesmo arquivo marca suporte/tickets backend como ausente, mas já existem endpoints de ticket e contexto de suporte.
3. Persistência existe hoje por arquivo local (`.tmp-store`), não por banco relacional; classificação correta é `PARCIAL`, não `AUSENTE`.

## Regra de ouro
Se a decisão não cabe claramente em um domínio e não tem “definição de pronto” escrita, não executar.
