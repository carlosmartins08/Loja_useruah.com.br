# Local Docker Database Runbook

Data de revisao: 2026-07-19

## Objetivo
Subir base local consistente no Docker Desktop para homologar arquitetura de banco sem travar a evolucao funcional.

## Pre-requisitos
- Docker Desktop instalado e em execucao.
- Porta `3306` livre para MySQL.
- Porta `8080` livre para Adminer.

## Subida do ambiente
```bash
docker compose up -d mysql adminer
docker compose ps
```

## Acesso
- MySQL
  - Host: `localhost`
  - Porta: `3306`
  - DB: `useruah`
  - User: `useruah`
  - Password: `useruah_local_dev`
- Adminer: `http://localhost:8080`

## Estrutura criada automaticamente
- `infra/mysql/init/001_payments.sql` inicializa:
  - `orders`
  - `production_jobs`
  - `shipments`
  - `payments`
  - `payment_idempotency`
  - `payment_events`
  - `webhook_events`
- `infra/mysql/migrations/002_distribution_authority.sql` cria as tabelas relacionais de campanhas, vínculos de produtos e referral.

## Variaveis de ambiente
Use `.env.example` como base:
- `DATABASE_URL=mysql://useruah:useruah_local_dev@localhost:3306/useruah`
- `PAYMENT_PERSISTENCE=mysql` (runtime local canonico)
- `PAYMENT_PROVIDER=sandbox` para sandbox interno; use `gateway_sandbox` somente para homologar a bridge correspondente.

## Check operacional minimo
1. `npm run check`
2. `npm run qa:payments21`
3. `npm run qa:coreops`
4. Confirmar que webhook continua idempotente e timeline de eventos retorna no status.

## Politica temporaria de execucao (EPERM)

Enquanto o ambiente local estiver com bloqueio `spawn EPERM`, padronizar:
- Executar `build` e `QA` com permissao elevada.
- Registrar no PR/evidencia quando a elevacao foi necessaria.
- Nao bloquear entrega de dominio por esse ponto, mas manter item de infraestrutura aberto para correcao definitiva.

## Politica de persistencia
1. Manter contrato API congelado.
2. Usar MySQL como fonte oficial do runtime local integrado.
3. Usar SQLite ou `dev-store` somente quando uma suite de QA declarar explicitamente esse modo.
4. Nao aceitar fallback silencioso de MySQL para arquivo local.
5. Reexecutar QA automatica antes de levar a mesma stack para homologacao ou producao.

## Migração e backfill

```bash
npm run db:migrate:mysql:plan
npm run db:migrate:mysql
npm run db:readiness:mysql
npm run db:backfill:authority
npm run db:backfill:authority:audit
npm run db:backfill:promotion:preflight -- --manifest=path/to/manifest.json
```

- O comando de migração é idempotente e registra checksum em `schema_migrations`.
- O backfill executa somente com escopo explícito, por exemplo: `npm run db:backfill:authority:execute -- --allow-prefix=ORG-APROVADO-`.
- Nunca executar backfill de todo `.tmp-store` sem classificar seeds, QA, histórico e ambiente de origem.
- Depois de qualquer backfill, repetir readiness, contagens, restart e os fluxos críticos do domínio.
- O auditor de backfill é somente leitura e deve passar antes de qualquer aprovação de prefixo.
- O preflight externo exige snapshot com SHA-256, URL HTTPS externa, escopo sem curingas, backup, rollback e segredo de banco presente; nunca imprime o segredo.
