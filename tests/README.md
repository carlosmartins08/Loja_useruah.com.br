# Tests

## Objetivo
Reservar a casa de testes orientados a framework e asserts locais de codigo.

## Regra atual do projeto
- `scripts/qa/**` e a trilha ativa para QA operacional, readiness, smoke, regressao por fluxo e validacao de ambiente
- `tests/**` deve ser usado para testes canonicos de framework quando existirem:
  - unitarios
  - integracao isolada
  - specs de baixo acoplamento com ambiente

## O que nao deve entrar em `tests/**`
- runner que sobe servidor
- smoke dependente de porta, env e bootstrap operacional
- cutover, preflight ou go-live
- evidencia operacional ou screenshot

## O que deve entrar em `scripts/qa/**`
- suites que dependem de `QA_PORT`, `QA_BASE_URL`, actor headers ou bootstrap de ambiente
- validacao ponta a ponta por dominio
- smoke de provider
- auditoria operacional de matriz, blindspots e reconciliacao

## Regra de decisao
- se o teste precisa subir ou conversar com a aplicacao como sistema rodando, prefira `scripts/qa/**`
- se o teste valida comportamento local, deterministico e orientado a framework, prefira `tests/**`
