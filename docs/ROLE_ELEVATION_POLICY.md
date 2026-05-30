# Role Elevation Policy

Data de revisao: 2026-05-30
Owner: Produto + Seguranca + Engenharia

## Regra central
- Em producao: `1 usuario = 1 papel primario ativo`.
- Qualquer acao fora do papel primario exige elevacao explicita.
- Aprovacao manual e obrigatoria apenas para acoes criticas.

## Ambiente
- `AUTH_ADMIN_FULL_SCOPE=true`: permitido apenas em local/dev/staging controlado.
- `AUTH_ADMIN_FULL_SCOPE=false`: obrigatorio em producao.

## Controle tecnico
- Frontend orienta.
- Backend autoriza.
- AuditLog registra.

## Campos minimos para elevacao
- `actor_id`
- `primary_role`
- `elevated_role`
- `action`
- `entity_type`
- `entity_id`
- `scope`
- `reason`
- `expires_at`

## Acoes que exigem aprovacao manual
- payout/refund/chargeback
- alteracao de preco publico
- alteracao de comissao
- cancelamento de pedido pago
- bloqueio de usuario
- alteracao de politica/permissao

## Nota operacional
- Namespaces canonicamente separados por papel:
  - `/account`, `/artist`, `/community`, `/affiliate`, `/supplier`, `/curation`, `/support`, `/production`, `/finance`, `/admin`
- Rotas legadas permanecem temporariamente por compatibilidade de migracao.

## Endpoints de operacao
- `POST /api/auth/elevations` cria elevacao (`requested` para alto risco; `approved` para baixo risco).
- `GET /api/auth/elevations` lista elevacoes do proprio ator.
- `POST /api/auth/elevations/:id/approve` aprova elevacao pendente.
- `POST /api/auth/elevations/:id/reject` rejeita elevacao pendente.
- `GET /api/admin/elevations?status=requested` fila operacional para aprovadores.
