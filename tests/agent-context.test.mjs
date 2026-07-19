import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildAgentRoute } from '../scripts/lib/agent-context.mjs';

const root = path.resolve(process.cwd());

test('routes critical-flow audit as read-only request without hiding active-front constraint', () => {
  const route = buildAgentRoute(
    root,
    'Auditoria 360 do fluxo critico catalogo produto carrinho checkout pedido pagamento webhook producao'
  );

  assert.equal(route.requestType, 'audit_360');
  assert.equal(route.routingMode, 'request_first');
  assert.equal(route.executionStatus, 'ROUTED_READ_ONLY');
  assert.equal(route.auditPlan.executionMode, 'read_only');
  assert.ok(route.auditPlan.scope.includes('payment'));
  assert.ok(route.activeFront);
  assert.equal(Boolean(route.activeFrontConstraint), route.blocked);
});

test('keeps ordinary routing tied to the active front', () => {
  const route = buildAgentRoute(root, 'mostrar o briefing operacional atual');

  assert.equal(route.requestType, 'continuity');
  assert.equal(route.routingMode, 'active_front');
  assert.equal(route.auditPlan, null);
  assert.equal(route.activeFront, 'FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT');
});

test('preserves W7 and W8 in the controlled execution history', () => {
  const route = buildAgentRoute(root, 'Criar um plano pratico de continuidade sem reabrir pagamentos');

  const waveIds = route.executionPlan.waves.map((wave) => wave.id);
  assert.ok(waveIds.includes('W7'));
  assert.ok(waveIds.includes('W8'));
});

test('routes structural coherence work as a read-only audit with phased evidence', () => {
  const route = buildAgentRoute(root, 'Organizar a casa e eliminar incoerencias de arquitetura, dados, contratos, ambientes e documentacao');

  assert.equal(route.requestType, 'coherence_audit');
  assert.equal(route.routingMode, 'request_first');
  assert.equal(route.executionStatus, 'ROUTED_READ_ONLY');
  assert.equal(route.auditPlan.auditType, 'coherence_audit');
  assert.ok(route.auditPlan.phases.includes('authority_baseline'));
  assert.ok(route.auditPlan.scope.includes('persistence'));
  assert.ok(route.auditPlan.findingSchema.includes('acceptanceCriteria'));
  assert.equal(route.activeFrontConstraint, null);
});

test('routes complete-delivery requests as a gated execution plan', () => {
  const route = buildAgentRoute(
    root,
    'Criar um plano pratico para chegar a 100% da funcionalidade sem quebrar o projeto, sem duplicidade ou incoerencia'
  );

  assert.equal(route.requestType, 'execution_plan');
  assert.equal(route.routingMode, 'request_first');
  assert.equal(route.executionStatus, 'PLANNED_CONTROLLED_EXECUTION');
  assert.equal(route.executionPlan.executionType, 'controlled_delivery_plan');
  assert.ok(route.executionPlan.waves.some((wave) => wave.id === 'W0'));
  assert.ok(route.executionPlan.definitionOfDone.some((item) => item.includes('rollback definido')));
  assert.equal(route.activeFrontConstraint, null);
});
