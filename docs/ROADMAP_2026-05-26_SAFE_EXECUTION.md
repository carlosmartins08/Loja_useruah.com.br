# Roadmap de Execucao Segura (2026-05-26)

Data de criacao: 2026-05-25  
Owner: Produto + Engenharia + QA  
Status: pronto para execucao com gatilho `GO/NO-GO`

## Objetivo
Executar a evolucao de papeis/permissoes e fechar pendencias abertas de 2026-05-25 sem quebrar rotas, sem duplicar regras e sem perder entregas ja prontas.

## Premissas nao negociaveis
- Nao remover fluxo legado antes do novo estar validado.
- Nao executar PR misto (cada PR com um unico objetivo).
- Nao duplicar regra de role/session fora de pontos oficiais.
- Toda alteracao critica precisa manter AuditLog e RBAC.

## Gatilho de execucao (amanha, 2026-05-26 09:00)
Executar somente se todos os itens abaixo estiverem `PASS`:

1. `npm run check:strict`
2. `npm run qa:ux:journeys`
3. `npm run qa:coreops`
4. Servidor local abre `/`, `/shop`, `/product/[id]`, `/checkout`, `/account`, `/admin` sem erro 500
5. Sem incidente aberto de login/redirect por role
6. Branch dedicada criada: `feat/rbac-multirole-phase1`

Se qualquer item falhar: `NO-GO` e corrigir antes de iniciar fase 1.

## Escopo fechado de amanha
1. Blindagem de redirect por role (fonte unica)
2. Preparacao de modelo multi-role sem quebra do modelo atual
3. Fechamento de textos quebrados visiveis no frontend critico
4. Normalizacao de line endings e estabilidade de merge

## Pendencias abertas de hoje (2026-05-25)
1. Alinhar matriz documental de roles com modelo efetivo do frontend/sessao
- Hoje o runtime opera com 4 roles (`customer`, `platform_admin`, `support_agent`, `production_operator`), enquanto docs citam papeis adicionais.
- Acao: criar plano de compatibilidade (`faseado`) sem quebra de auth atual.

2. Consolidar helper unico de destino por role
- Ja corrigido em pontos criticos, mas falta centralizar para impedir regressao futura.
- Acao: criar helper unico em `lib` e consumir em `login`, `account`, `admin layout`.

3. Revisar copy com encoding quebrado em telas nao criticas
- Home critica ja corrigida; ainda existem textos tecnicos sem acento em areas internas.
- Acao: tratar backlog sem alterar contrato/fluxo.

4. Evitar drift de permissao por role em novas telas
- Acao: checklist obrigatorio por PR com validacao de role/guard.

## Plano de execucao por fases (amanha)

### Fase 0 - Congelamento (09:00-09:30)
- Confirmar gatilho `GO`.
- Rodar baseline e anexar evidencias.
- Nenhuma feature nova fora do plano.

### Fase 1 - Compatibilidade de acesso (09:30-11:30)
- Criar helper canonicamente:
  - `resolveHomeByRole(role)`
  - `isAllowedAdminPath(role, pathname)`
- Substituir chamadas espalhadas por helper unico.
- Garantir fallback seguro para role desconhecida -> `/login`.

### Fase 2 - Preparacao multi-role sem ruptura (11:30-14:00)
- Estender tipo de sessao para suportar:
  - `roles[]`
  - `activeRole`
- Manter compatibilidade:
  - se vier role unico, converter para `roles=[role]` e `activeRole=role`.
- Nao liberar UI de troca de role ainda (apenas infraestrutura).

### Fase 3 - Hardening de guardas e auditoria (14:00-16:00)
- Garantir que acoes criticas mantenham `actor_role` explicito.
- Validar bloqueios 403 com escape route por role.
- Revisar apenas rotas criticas:
  - `/login`
  - `/account`
  - `/admin`
  - `/admin/support`
  - `/admin/production`
  - `/admin/payments/connectors`

### Fase 4 - Gate final e liberacao (16:00-17:30)
- Executar:
  - `npm run check:strict`
  - `npm run qa:ux:journeys`
  - `npm run qa:coreops`
- Smoke manual por perfil:
  - customer
  - support_agent
  - production_operator
  - platform_admin
- Publicar status final em `docs/EXECUTION_TRACKING.md`.

## Criticos de bloqueio (para abortar release da fase)
- Redirect incorreto pos-login para qualquer role.
- Customer acessando rota admin.
- Support/Production fora do escopo permitido.
- Qualquer quebra em `qa:coreops`.

## Matriz de risco e mitigacao
- Risco: regressao de redirect por role.
  - Mitigacao: helper unico + smoke por role.
- Risco: quebra de compatibilidade de sessao.
  - Mitigacao: fallback de role unico para estrutura multi-role.
- Risco: retrabalho por PR grande.
  - Mitigacao: PR curto por fase.

## Evidencia minima de conclusao
- Logs dos comandos obrigatorios com `PASS`.
- Lista de arquivos alterados por fase.
- Registro de riscos residuais (se houver).

