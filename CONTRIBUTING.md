# Como contribuir com a UseRuah

Este guia e a porta de entrada para trabalho humano. Ele orienta a execucao, mas nao substitui as fontes de autoridade em `docs/**`.

## Regra essencial

`main` e a unica base compartilhada de trabalho. Toda mudanca nasce dela, entra por pull request e volta para ela somente depois dos gates aplicaveis.

Nao use `.tmp-store/**`, caches locais ou memoria de conversas como fonte de verdade. Para continuidade e escopo ativo, siga `docs/README_DOCS_HIERARCHY.md` e `docs/DOCS_CLASSIFICATION.md`.

## Comece pela missao, nao pela pasta

| Missao | Leia antes de alterar | Onde a mudanca costuma viver | Validacao minima |
| --- | --- | --- | --- |
| Retomar trabalho serial ou decidir prioridade | `docs/ACTIVE_FRONT.md`, `docs/NEXT_SESSION_TRIGGER.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` | somente o recorte autorizado | `npm run check` |
| Tela, rota, navegacao ou UX | `docs/ROUTE_DEFINITION_OF_DONE.md`, `docs/DESIGN.md`, `docs/CODEBASE_MAP.md` | `app/**`, `components/**`, `hooks/**`, `context/**` | `npm run check` e smoke dirigido |
| API, regra de negocio ou contrato | `docs/API_CONTRACTS.md`, documento do dominio e `docs/CODEBASE_MAP.md` | `app/api/**`, `lib/**` | `npm run check` e QA do dominio |
| Papel, permissao ou sessao | `docs/ROLES_MATRIX.md`, `docs/USER_360_ROLE_ALIGNMENT.md`, `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md` | `lib/access-control.ts`, `lib/role-*`, rotas e guards relacionados | `npm run qa:base:roles` quando o ambiente for seguro |
| Persistencia, migration ou MySQL | `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`, documento de dominio e `docs/ARCHITECTURE.md` | `infra/mysql/**`, `lib/*-store.ts`, `scripts/db/**` | migration/readiness somente em base descartavel autorizada |
| QA, gate, release ou operacao | `scripts/README.md`, `tests/README.md`, documento de dominio | `scripts/qa/**`, `scripts/gates/**`, `scripts/release/**`, `tests/**` | comando documentado, sem ambiente real por inferencia |
| Documento, decisao ou continuidade | `docs/README_DOCS_HIERARCHY.md`, `docs/DOCS_CLASSIFICATION.md` | documento fonte existente | `npm run check` e `git diff --check` |

Se a missao depender de capacidade `PARCIAL`, `PLANEJADO`, `NAO PRESUMIR` ou `BLOQUEADO`, nao avance por suposicao.

## Preparar o ambiente local

```bash
git switch main
git pull --ff-only
npm ci
```

Configure o ambiente seguindo `.env.example`. Para MySQL local e migrations, use `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`; nunca reutilize banco ou credencial de producao para QA.

## Abrir uma mudanca

```bash
git switch main
git pull --ff-only
git switch -c feat/resumo-curto-da-missao
```

- `feat/`: capacidade nova dentro de dominio autorizado.
- `fix/`: defeito reproduzivel.
- `docs/`: navegacao, regra ou evidencia documental.
- `chore/`: manutencao sem mudanca de comportamento de produto.

Uma branch deve conter uma missao verificavel. Nao use branch longa como linha permanente de integracao, nem misture camadas que nao pertencem ao mesmo resultado entregue.

## Decidir o local correto antes de criar arquivo

1. Procure implementacao existente com `rg` e consulte `docs/CODEBASE_MAP.md`.
2. Reutilize ou expanda o modulo existente quando a responsabilidade ja existir.
3. Crie algo novo somente se houver responsabilidade recorrente e dono claro.
4. Preserve as fronteiras:
   - `components/**` renderiza e compoe UI.
   - `hooks/**` trata DOM, browser e comportamento local de UI.
   - `context/**` coordena estado cliente entre telas.
   - `lib/**` decide regra, permissao, persistencia e integracao.
   - `app/api/**` e a superficie HTTP; nao e backend separado.

Mudanca de endpoint, store, script ou fronteira arquitetural exige atualizacao do mapa ou documento fonte correspondente.

## Validar antes de pedir revisao

Sempre execute:

```bash
npm run check
git diff --check
```

Depois acrescente apenas os gates proporcionais ao risco. Nao rode QA mutavel, migration, seed, checkout, pagamento ou webhook real sem ambiente descartavel e autorizacao explicita.

O CI executa `npm run pr:premerge`, alertas criticos, build e smoke em pull requests e na `main`. Consulte `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md` para o checklist completo.

## Pull request e revisao

Todo PR declara missao, fontes consultadas, arquivos e contratos afetados, validacoes, risco e rollback. Use o template automatico em `.github/PULL_REQUEST_TEMPLATE.md`.

Nao invente owner: enquanto nao houver `CODEOWNERS` aprovado, o autor indica no PR quem revisa o dominio afetado.

Depois do merge, confirme a `main` e apague a branch de trabalho local e remota.

## Configuracao obrigatoria no GitHub

Administradores devem configurar na plataforma:

- pull request obrigatorio para alterar `main`;
- workflow `Quality And Smoke` obrigatorio;
- bloqueio de force-push e exclusao de `main`;
- ao menos uma revisao para mudancas normais;
- bypass administrativo restrito e auditavel.

Essas protecoes completam a trilha: missao -> fonte de autoridade -> local correto -> validacao -> revisao -> `main`.
