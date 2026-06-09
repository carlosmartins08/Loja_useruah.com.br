# Scripts

## Objetivo
Organizar automacao operacional por responsabilidade, sem mudar os comandos publicos de `npm`.

## Estrutura
- `scripts/check-utf8.mjs`
  - gate estatico isolado porque entra cedo em `build` e `check:strict`
- `scripts/catalog/`
  - seed, reidratacao e geracao editorial de catalogo
- `scripts/gates/`
  - gates de PR e impacto antes de merge
- `scripts/lib/`
  - helpers compartilhados entre QA, catalogo e readiness
- `scripts/ops/`
  - alertas operacionais, janelas e reconciliacao
- `scripts/qa/`
  - suites QA e runners
- `scripts/release/`
  - preflight, provas de go-live e readiness de cutover

## Regra de manutencao
- suite nova de QA entra em `scripts/qa/`
- helper reaproveitavel entra em `scripts/lib/`
- script de cutover, preflight ou go-live entra em `scripts/release/`
- script de rotina operacional entra em `scripts/ops/`
- script de catalogo entra em `scripts/catalog/`
- regra nova de gate entra em `scripts/gates/`

## Entrada publica
Preferir `npm run ...` via `package.json`.
Nao assumir caminho fisico direto de script sem checar os aliases atuais em `package.json`.
