#!/usr/bin/env node
import { ensureAgentPlanFile } from '../lib/agent-context.mjs';

const { plan } = ensureAgentPlanFile();

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      output: '.tmp-store/active-agent-plan.json',
      activeFront: plan.activeFront,
      blocked: plan.blocked,
      requiredAgents: plan.requiredAgents,
      supportOffices: plan.supportOffices,
    },
    null,
    2
  )
);
