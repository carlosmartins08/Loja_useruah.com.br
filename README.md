# Loja UseRuah

Aplicação Next.js da loja UseRuah com foco em catálogo/curadoria, checkout, pagamentos, pedidos/logística e suporte.

## Requisitos

- Node.js 20+
- npm 10+

## Setup local

1. Instale dependências:
   - `npm install`
2. Copie variáveis:
   - `.env.example` -> `.env.local`
3. Suba a aplicação:
   - `npm run dev`

## Comandos principais

- Qualidade:
  - `npm run check`
  - `npm run check:strict`
  - `npm run alert:critical`
- Build:
  - `npm run build`
  - `npm run start`
- QA:
  - `npm run qa:catalog`
  - `npm run qa:payments21`
  - `npm run qa:coreops`
  - `npm run qa:functional`
  - `npm run qa:full`

## Observações de execução

- `qa:catalog`, `qa:payments21` e `qa:coreops` sobem servidor automaticamente na porta alvo.
- `qa:coreops` valida ciclo cruzado `order -> payment -> production -> shipment -> support`.
- Se já existir servidor em execução nas portas de QA, os scripts reutilizam a instância ativa.
- Em ambientes com bloqueio `spawn EPERM`, execute os comandos de QA/build com permissão elevada.
- Governança e critérios de pronto por domínio estão em `docs/EXECUTION_CONSOLIDATED_MASTER.md` e `docs/EXECUTION_STATUS_MATRIX.md`.
