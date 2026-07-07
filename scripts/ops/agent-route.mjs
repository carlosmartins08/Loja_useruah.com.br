#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildAgentRoute, formatAgentBrief } from '../lib/agent-context.mjs';

const root = process.cwd();
const requestText = process.argv.slice(2).join(' ').trim();
const route = buildAgentRoute(root, requestText);
const outputDir = path.join(root, '.tmp-store');
const outputPath = path.join(outputDir, 'agent-route.json');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(route, null, 2)}\n`, 'utf8');

console.log(formatAgentBrief(route));
console.log('');
console.log(
  JSON.stringify(
    {
      status: 'PASS',
      output: '.tmp-store/agent-route.json',
      activeFront: route.activeFront,
      requestText: route.requestText,
      primaryAgents: route.requiredAgents,
      recommendedSkills: route.recommendedSkills?.slice(0, 5)?.map((skill) => skill.name) ?? [],
    },
    null,
    2
  )
);
