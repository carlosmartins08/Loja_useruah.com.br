# Local Docker Database Runbook

Data de revisao: 2026-05-21

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

## Variaveis de ambiente
Use `.env.example` como base:
- `DATABASE_URL=mysql://useruah:useruah_local_dev@localhost:3306/useruah`
- `PAYMENT_PERSISTENCE=sqlite` (atual)
- `PAYMENT_PROVIDER=gateway_sandbox` para homologacao de fluxo assincrono.

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

## Estrategia de migracao sem retrabalho
1. Manter contrato API congelado.
2. Trocar somente adapter de persistencia (`sqlite -> mysql`) atras da mesma interface.
3. Reexecutar QA automatica.
4. Levar mesma stack para servidor hospedado.
