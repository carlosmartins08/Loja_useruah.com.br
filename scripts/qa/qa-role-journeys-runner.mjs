#!/usr/bin/env node

import net from 'node:net';
import { existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { QA_LOCAL_AUTH_USERS_JSON } from './qa-local-auth-users.mjs';

const PORT = Number(process.env.QA_PORT ?? 3327);
const BASE_URL = `http://localhost:${PORT}`;
const QA_ENV = {
  ...process.env,
  RBAC_ACTIVE: 'true',
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET ?? 'qa-local-session-secret',
  AUTH_LOCAL_USERS_JSON: process.env.AUTH_LOCAL_USERS_JSON ?? QA_LOCAL_AUTH_USERS_JSON,
  QA_BASE_URL: BASE_URL,
};

function waitForPort(port, timeoutMs = 60000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const socket = new net.Socket();
      socket
        .setTimeout(1500)
        .once('connect', () => {
          socket.destroy();
          resolve();
        })
        .once('error', () => {
          socket.destroy();
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Timed out waiting for localhost:${port}`));
            return;
          }
          setTimeout(probe, 500);
        })
        .once('timeout', () => {
          socket.destroy();
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Timed out waiting for localhost:${port}`));
            return;
          }
          setTimeout(probe, 500);
        })
        .connect(port, '127.0.0.1');
    };
    probe();
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function spawnNpm(args, env = process.env) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], {
      stdio: 'inherit',
      windowsHide: true,
      env,
    });
  }

  return spawn('npm', args, { stdio: 'inherit', env });
}

function spawnNode(scriptPath, env = process.env) {
  return spawn(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env,
    windowsHide: process.platform === 'win32',
  });
}

function killProcessTree(child) {
  if (!child?.pid) return Promise.resolve();
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
  }

  return new Promise((resolve) => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // ignore
    }
    resolve();
  });
}

async function runCommand(kind, args, env = process.env) {
  const child = kind === 'node' ? spawnNode(args[0], env) : spawnNpm(args, env);
  const exitCode = await waitForExit(child);
  if (exitCode !== 0) {
    throw new Error(`${kind} ${args.join(' ')} failed with exit code ${exitCode}`);
  }
}

async function main() {
  if (existsSync('.next')) {
    rmSync('.next', { recursive: true, force: true });
  }

  await runCommand('npm', ['run', 'build'], QA_ENV);

  const server = spawnNpm(['run', 'start', '--', '-p', String(PORT)], QA_ENV);
  try {
    await waitForPort(PORT);
    await runCommand('node', ['scripts/qa/qa-role-authenticated-journeys.mjs'], QA_ENV);
  } finally {
    await killProcessTree(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
