import { spawn } from 'node:child_process';
import path from 'node:path';

const env = {
  ...process.env,
  QA_PORT: '3332',
  QA_SERVER_MODE: 'start',
  QA_SCRIPT: 'scripts/qa/qa-payments-2-1.mjs',
  RBAC_ACTIVE: 'true',
  ALLOW_HEADER_ACTOR_FALLBACK: 'false',
  AUTH_SESSION_SECRET: 'qa-local-session-secret',
  QA_PAYMENT_PROVIDER: 'stripe',
  PAYMENT_PROVIDER: 'stripe',
  QA_EXPECT_PERSISTENCE: 'mysql',
  PAYMENT_PERSISTENCE: 'mysql',
};

const runnerPath = path.resolve('scripts/qa/qa-api-runner.mjs');
const child = spawn(process.execPath, [runnerPath], {
  stdio: 'inherit',
  env,
  windowsHide: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
