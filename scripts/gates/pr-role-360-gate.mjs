#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';

function getChangedFiles() {
  const commands = ['git diff --name-only --cached', 'git diff --name-only', 'git diff --name-only HEAD', 'git status --porcelain'];
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (out) {
        const lines = out
          .split(/\r?\n/)
          .filter(Boolean);
        const normalized =
          cmd === 'git status --porcelain'
            ? lines.map((line) => line.slice(3).trim()).filter(Boolean)
            : lines;
        return normalized.map((line) => line.replace(/\\/g, '/'));
      }
    } catch {}
  }
  return [];
}

const roleSensitiveMatchers = [
  /^app\/api\/auth\//,
  /^app\/api\/.*$/,
  /^app\/(account|admin)\//,
  /^lib\/(access-control|access-routing|auth-session|session-token)\.ts$/,
  /^lib\/role-matrix\//,
  /^docs\/(ROLES_MATRIX|WORKFLOW_RBAC_ACCESS_MATRIX|API_CONTRACTS|REGISTRATION_MATRIX_BY_ROLE|USER_360_ROLE_ALIGNMENT)\.md$/,
];

function extractSection(text, headingPrefix) {
  const start = text.indexOf(headingPrefix);
  if (start === -1) return null;
  const afterStart = text.slice(start);
  const nextHeadingOffset = afterStart.slice(headingPrefix.length).search(/\n##\s+/);
  if (nextHeadingOffset === -1) return afterStart;
  return afterStart.slice(0, headingPrefix.length + nextHeadingOffset);
}

function hasCheckedOption(section, prompt) {
  const idx = section.indexOf(prompt);
  if (idx === -1) return false;
  const tail = section.slice(idx);
  const nextPrompt = tail.search(/\n- [^\n]+:\n/);
  const block = nextPrompt > 0 ? tail.slice(0, nextPrompt) : tail;
  return block.includes('[x] Sim') || block.includes('[X] Sim') || block.includes('[x] Nao') || block.includes('[X] Nao');
}

const changedFiles = getChangedFiles();
const roleSensitiveTouched = changedFiles.some((file) => roleSensitiveMatchers.some((matcher) => matcher.test(file)));

if (!roleSensitiveTouched) {
  console.log(JSON.stringify({ status: 'PASS', reason: 'no_role_sensitive_changes' }, null, 2));
  process.exit(0);
}

const prBodyFile = process.env.PR_BODY_FILE?.trim();
if (!prBodyFile) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'missing_pr_body_file',
        hint: 'Defina PR_BODY_FILE com o caminho do corpo do PR preenchido.',
      },
      null,
      2
    )
  );
  process.exit(1);
}

if (!fs.existsSync(prBodyFile)) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'pr_body_file_not_found', prBodyFile }, null, 2));
  process.exit(1);
}

const text = fs.readFileSync(prBodyFile, 'utf8');
const section = extractSection(text, '## 2.1) Validacao 360 de usuario/papel');
if (!section) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'missing_section_2_1' }, null, 2));
  process.exit(1);
}

const requiredLinePrefixes = [
  '- Papel(is) afetado(s):',
  '- Documento de reconciliacao consultado:',
];

const missingFields = [];
for (const prefix of requiredLinePrefixes) {
  const line = section
    .split(/\r?\n/)
    .find((candidate) => candidate.trimStart().startsWith(prefix));
  if (!line) {
    missingFields.push(prefix);
    continue;
  }
  const value = line.split(':').slice(1).join(':').trim();
  if (!value || value === '-' || value.toLowerCase() === 'n/a') {
    missingFields.push(prefix);
  }
}

const requiredChecks = [
  '- Papel no dominio (`docs/ROLES_MATRIX.md`) confere com runtime/sessao?',
  '- Papel no runtime/sessao confere com rota frontend (`docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`)?',
  '- Papel confere com contrato/API (`docs/API_CONTRACTS.md`)?',
];

const missingCheckAnswers = requiredChecks.filter((prompt) => !hasCheckedOption(section, prompt));

if (missingFields.length > 0 || missingCheckAnswers.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'incomplete_role_360_validation',
        missingFields,
        missingCheckAnswers,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      reason: 'role_360_validation_complete',
      changedFiles: changedFiles.length,
      prBodyFile,
    },
    null,
    2
  )
);
