#!/usr/bin/env node
import { ensureAgentPlanFile, formatAgentBrief } from '../lib/agent-context.mjs';

const { plan } = ensureAgentPlanFile();
const report = formatAgentBrief(plan);

console.log(report);
