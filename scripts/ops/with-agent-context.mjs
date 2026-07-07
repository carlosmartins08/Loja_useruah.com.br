#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { buildAgentRoute, formatAgentBrief } from '../lib/agent-context.mjs';

const args = process.argv.slice(2);
if (args.length === 0 || args[0] !== '--' || args.length < 2) {
  console.error('Usage: node scripts/ops/with-agent-context.mjs -- <command> [args...]');
  process.exit(1);
}

const command = args[1];
const commandArgs = args.slice(2);
const requestText = [command, ...commandArgs].join(' ').trim();
const route = buildAgentRoute(process.cwd(), requestText);

console.log(formatAgentBrief(route));
console.log('');
console.log(`[RUN] ${command} ${commandArgs.join(' ')}`.trim());

const isWin = process.platform === 'win32';
const shell = isWin ? 'cmd.exe' : 'sh';
const shellArgs = isWin ? ['/d', '/s', '/c', [command, ...commandArgs].join(' ')] : ['-lc', [command, ...commandArgs].join(' ')];

const result = spawnSync(shell, shellArgs, { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
