import net from 'node:net';
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { buildAgentPlan, ensureAgentPlanFile, formatAgentBrief } from '../lib/agent-context.mjs';

const PORT = Number(process.env.QA_PORT ?? 3200);
const QA_SCRIPT = process.env.QA_SCRIPT;
const QA_SERVER_MODE = (process.env.QA_SERVER_MODE ?? 'dev').toLowerCase();
const QA_REUSE_EXISTING = String(process.env.QA_REUSE_EXISTING ?? 'false').toLowerCase() === 'true';
const QA_REQUIRE_ISOLATED_DATABASE = String(process.env.QA_REQUIRE_ISOLATED_DATABASE ?? 'false').toLowerCase() === 'true';
const IS_CODEX_WINDOWS_SANDBOX = process.platform === 'win32' && process.env.CODEX_SANDBOX_NETWORK_DISABLED === '1';

if (!QA_SCRIPT) {
  console.error('QA_SCRIPT is required (example: scripts/qa/qa-catalog-lifecycle.mjs)');
  process.exit(1);
}

const BASE_URL = `http://localhost:${PORT}`;
const NEXT_BIN = 'node_modules/next/dist/bin/next';

function resolveQaNextDistDir() {
  const rawValue = process.env.QA_NEXT_DIST_DIR;
  if (rawValue === undefined) return null;

  const configuredPath = String(rawValue).trim();
  if (!configuredPath || configuredPath === '.' || configuredPath === '/' || configuredPath === '\\') {
    throw new Error('QA_NEXT_DIST_DIR_MUST_BE_UNDER_TMP_STORE');
  }

  const rootDir = path.resolve(process.cwd());
  const sharedNextDir = path.resolve(rootDir, '.next');
  const tmpStoreDir = path.resolve(rootDir, '.tmp-store');
  const resolvedPath = path.resolve(rootDir, configuredPath);

  if (resolvedPath === sharedNextDir) {
    throw new Error('QA_NEXT_DIST_DIR_MUST_NOT_BE_SHARED_NEXT');
  }

  const relativePath = path.relative(tmpStoreDir, resolvedPath);
  const isInsideTmpStore =
    Boolean(relativePath) &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);

  if (!isInsideTmpStore) {
    throw new Error('QA_NEXT_DIST_DIR_MUST_BE_UNDER_TMP_STORE');
  }

  return resolvedPath;
}

function resolveQaDatabaseUrl() {
  const qaDatabaseUrl = String(process.env.QA_DATABASE_URL ?? '').trim();
  if (!qaDatabaseUrl) throw new Error('QA_DATABASE_URL_REQUIRED');

  let parsed;
  try {
    parsed = new URL(qaDatabaseUrl);
  } catch {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  if (parsed.protocol !== 'mysql:' && parsed.protocol !== 'mysql2:') {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!database || !/(qa|test|disposable|ephemeral)/i.test(database)) {
    throw new Error('QA_DATABASE_URL_MUST_TARGET_QA_DATABASE');
  }

  const inheritedDatabaseUrl = String(process.env.DATABASE_URL ?? '').trim();
  if (inheritedDatabaseUrl) {
    try {
      if (new URL(inheritedDatabaseUrl).toString() === parsed.toString()) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL') {
        throw error;
      }
      if (inheritedDatabaseUrl === qaDatabaseUrl) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    }
  }

  return qaDatabaseUrl;
}

const qaNextDistDir = resolveQaNextDistDir();
const qaDatabaseUrl = QA_REQUIRE_ISOLATED_DATABASE ? resolveQaDatabaseUrl() : null;
const effectiveEnv = qaDatabaseUrl ? { ...process.env, DATABASE_URL: qaDatabaseUrl } : process.env;
const activeAgentPlan = QA_REQUIRE_ISOLATED_DATABASE ? buildAgentPlan() : ensureAgentPlanFile().plan;

console.log(formatAgentBrief(activeAgentPlan));

function hasNextBuildArtifacts() {
  return existsSync(path.join(qaNextDistDir ?? path.resolve('.next'), 'BUILD_ID'));
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket
      .setTimeout(800)
      .once('connect', () => {
        socket.destroy();
        resolve(true);
      })
      .once('error', () => {
        socket.destroy();
        resolve(false);
      })
      .once('timeout', () => {
        socket.destroy();
        resolve(false);
      })
      .connect(port, '127.0.0.1');
  });
}

function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket
        .setTimeout(1500)
        .once('connect', () => {
          socket.destroy();
          resolve();
        })
        .once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timed out waiting for localhost:${port}`));
            return;
          }
          setTimeout(tryConnect, 500);
        })
        .once('timeout', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timed out waiting for localhost:${port}`));
            return;
          }
          setTimeout(tryConnect, 500);
        })
        .connect(port, '127.0.0.1');
    };
    tryConnect();
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

function spawnNpm(args, env = process.env) {
  if (process.platform === 'win32') {
    const command = ['npm', ...args].map(quoteWindowsCmdArg).join(' ');
    return spawn(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', ['/d', '/s', '/c', command], {
      stdio: 'inherit',
      windowsHide: true,
      detached: false,
      env,
    });
  }

  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && existsSync(npmExecPath)) {
    return spawn(process.execPath, [npmExecPath, ...args], {
      stdio: 'inherit',
      windowsHide: process.platform === 'win32',
      detached: process.platform !== 'win32',
      env,
    });
  }

  return spawn('npm', args, {
    stdio: 'inherit',
    windowsHide: false,
    detached: true,
    env,
  });
}

function quoteWindowsCmdArg(value) {
  if (!value) return '""';
  if (!/[\s"&|<>^]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function spawnNext(args, env = process.env) {
  if (!existsSync(NEXT_BIN)) {
    throw new Error(`QA runner could not find Next.js CLI at ${NEXT_BIN}. Run npm install before QA.`);
  }

  return spawn(process.execPath, [NEXT_BIN, ...args], {
    stdio: 'inherit',
    windowsHide: process.platform === 'win32',
    detached: process.platform !== 'win32',
    env,
  });
}

function cleanNextBuildArtifacts() {
  const nextDir = qaNextDistDir ?? path.resolve('.next');
  if (!existsSync(nextDir)) return;
  try {
    rmSync(nextDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`QA runner warning: failed to clean ${nextDir} before build: ${String(error)}`);
  }
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function waitForServerReady(server, port, timeoutMs = 60000) {
  if (!server) return waitForPort(port, timeoutMs);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finalize = (fn, value) => {
      if (settled) return;
      settled = true;
      server.off('error', onError);
      server.off('exit', onExit);
      fn(value);
    };
    const onError = (error) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EPERM' && IS_CODEX_WINDOWS_SANDBOX) {
        finalize(
          reject,
          new Error(
            'Windows Codex sandbox blocked the Next.js server process with spawn EPERM. Re-run this QA outside the sandbox or from a normal PowerShell session.'
          )
        );
        return;
      }
      finalize(reject, error);
    };
    const onExit = (code) => {
      finalize(reject, new Error(`QA server exited before opening localhost:${port} (exit code ${code ?? 1}).`));
    };

    server.once('error', onError);
    server.once('exit', onExit);

    waitForPort(port, timeoutMs)
      .then(() => finalize(resolve))
      .catch((error) => finalize(reject, error));
  });
}

async function main() {
  const portAlreadyOpen = await isPortOpen(PORT);
  if (portAlreadyOpen && !QA_REUSE_EXISTING) {
    console.error(
      [
        `QA runner aborted: localhost:${PORT} is already in use.`,
        'Use a dedicated free port (QA_PORT) or set QA_REUSE_EXISTING=true if you explicitly want to reuse an existing server.',
      ].join('\n')
    );
    process.exit(1);
  }

  let effectiveServerMode = QA_SERVER_MODE;

  if (!portAlreadyOpen && QA_SERVER_MODE === 'start' && IS_CODEX_WINDOWS_SANDBOX) {
    if (hasNextBuildArtifacts()) {
      console.warn(
        'QA runner warning: Windows Codex sandbox detected. Reusing the existing production build with next start because next build is unstable with spawn EPERM in this environment.'
      );
      effectiveServerMode = 'start';
    } else {
      console.error(
        [
          'QA runner aborted: Windows Codex sandbox cannot compile a fresh Next.js production build reliably in start mode.',
          'Run `npm run build` outside the sandbox first, or start the app manually and rerun with QA_REUSE_EXISTING=true.',
        ].join('\n')
      );
      process.exit(1);
    }
  }

  if (!portAlreadyOpen && effectiveServerMode === 'start') {
    if (!IS_CODEX_WINDOWS_SANDBOX) {
      cleanNextBuildArtifacts();
      const build = spawnNpm(['run', 'build'], effectiveEnv);
      const buildExit = await waitForExit(build);
      if (buildExit !== 0) {
        console.error('QA runner aborted: production build failed before start mode.');
        process.exit(buildExit);
      }
    }
  }

  const startArgs = effectiveServerMode === 'start' ? ['start', '-p', String(PORT)] : ['dev', '-p', String(PORT)];

  const server =
    portAlreadyOpen
      ? null
      : IS_CODEX_WINDOWS_SANDBOX
        ? spawnNext(startArgs, effectiveEnv)
        : spawnNpm(['run', ...startArgs.slice(0, 1), '--', ...startArgs.slice(1)], effectiveEnv);

  try {
    await waitForServerReady(server, PORT);
    const qa = spawn(process.execPath, [QA_SCRIPT], {
      stdio: 'inherit',
      env: { ...effectiveEnv, QA_BASE_URL: BASE_URL },
      windowsHide: process.platform === 'win32',
    });

    const exitCode = await waitForExit(qa);

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    if (server) {
      await killProcessTree(server);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
