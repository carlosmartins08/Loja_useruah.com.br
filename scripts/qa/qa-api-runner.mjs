import net from 'node:net';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildAgentPlan, ensureAgentPlanFile, formatAgentBrief } from '../lib/agent-context.mjs';

const PORT = Number(process.env.QA_PORT ?? 3200);
const QA_SCRIPT = process.env.QA_SCRIPT;
const QA_SERVER_MODE = (process.env.QA_SERVER_MODE ?? 'dev').toLowerCase();
const QA_REUSE_EXISTING = String(process.env.QA_REUSE_EXISTING ?? 'false').toLowerCase() === 'true';
const QA_REQUIRE_ISOLATED_DATABASE = String(process.env.QA_REQUIRE_ISOLATED_DATABASE ?? 'false').toLowerCase() === 'true';
const QA_ENABLE_CONTROLLED_RESTART = String(process.env.QA_ENABLE_CONTROLLED_RESTART ?? 'false').toLowerCase() === 'true';
const IS_CODEX_WINDOWS_SANDBOX = process.platform === 'win32' && process.env.CODEX_SANDBOX_NETWORK_DISABLED === '1';

if (!QA_SCRIPT) {
  console.error('QA_SCRIPT is required (example: scripts/qa/qa-catalog-lifecycle.mjs)');
  process.exit(1);
}

const BASE_URL = `http://localhost:${PORT}`;
const NEXT_BIN = 'node_modules/next/dist/bin/next';
const QA_VERSIONED_FILES = ['next-env.d.ts', 'tsconfig.json'];

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
  if (!child?.pid || child.exitCode !== null || child.signalCode) return Promise.resolve();
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

async function waitForPortToClose(port, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (await isPortOpen(port)) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for localhost:${port} to close before controlled restart.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function closeControlServer(controlServer) {
  if (!controlServer) return;
  await new Promise((resolve) => controlServer.close(resolve));
}

function startControlledRestartServer(restart) {
  const token = randomBytes(32).toString('base64url');
  const controlServer = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method !== 'POST' || requestUrl.pathname !== '/restart') {
      response.writeHead(404).end();
      return;
    }

    if (request.headers['x-qa-controlled-restart-token'] !== token) {
      response.writeHead(403).end();
      return;
    }

    try {
      await restart();
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, error: String(error) }));
    }
  });

  return new Promise((resolve, reject) => {
    controlServer.once('error', reject);
    controlServer.listen(0, '127.0.0.1', () => {
      controlServer.off('error', reject);
      const address = controlServer.address();
      if (!address || typeof address === 'string') {
        controlServer.close();
        reject(new Error('QA controlled restart server did not expose a local TCP address.'));
        return;
      }
      resolve({
        controlServer,
        url: `http://127.0.0.1:${address.port}/restart`,
        token,
      });
    });
  });
}

function snapshotVersionedFiles() {
  return QA_VERSIONED_FILES.map((relativePath) => {
    const filePath = path.resolve(relativePath);
    const existed = existsSync(filePath);

    return {
      filePath,
      existed,
      content: existed ? readFileSync(filePath) : null,
    };
  });
}

function restoreVersionedFiles(snapshots) {
  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      const currentContent = existsSync(snapshot.filePath) ? readFileSync(snapshot.filePath) : null;
      if (!currentContent || !currentContent.equals(snapshot.content)) {
        writeFileSync(snapshot.filePath, snapshot.content);
      }
      continue;
    }

    if (existsSync(snapshot.filePath)) {
      rmSync(snapshot.filePath, { force: true });
    }
  }
}

function cleanIsolatedNextArtifacts() {
  if (!qaNextDistDir || !existsSync(qaNextDistDir)) return;
  rmSync(qaNextDistDir, { recursive: true, force: true });
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
    throw new Error(
      [
        `QA runner aborted: localhost:${PORT} is already in use.`,
        'Use a dedicated free port (QA_PORT) or set QA_REUSE_EXISTING=true if you explicitly want to reuse an existing server.',
      ].join('\n')
    );
  }
  if (QA_ENABLE_CONTROLLED_RESTART && portAlreadyOpen) {
    throw new Error('QA controlled restart requires a server started by this runner; QA_REUSE_EXISTING is not supported.');
  }

  const versionedFileSnapshots = qaNextDistDir ? snapshotVersionedFiles() : null;
  let build = null;
  let server = null;
  let qa = null;
  let controlledRestart = null;
  let restartInFlight = null;
  let receivedSignal = null;
  let lifecycleError = null;

  const handleSignal = (signal) => {
    if (receivedSignal) return;
    receivedSignal = signal;
    for (const child of [qa, server, build]) {
      void killProcessTree(child);
    }
  };

  const onSigint = () => handleSignal('SIGINT');
  const onSigterm = () => handleSignal('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  try {
    let effectiveServerMode = QA_SERVER_MODE;

    if (!portAlreadyOpen && QA_SERVER_MODE === 'start' && IS_CODEX_WINDOWS_SANDBOX) {
      if (hasNextBuildArtifacts()) {
        console.warn(
          'QA runner warning: Windows Codex sandbox detected. Reusing the existing production build with next start because next build is unstable with spawn EPERM in this environment.'
        );
      } else {
        throw new Error(
          [
            'QA runner aborted: Windows Codex sandbox cannot compile a fresh Next.js production build reliably in start mode.',
            'Run `npm run build` outside the sandbox first, or start the app manually and rerun with QA_REUSE_EXISTING=true.',
          ].join('\n')
        );
      }
    }

    if (!portAlreadyOpen && effectiveServerMode === 'start' && !IS_CODEX_WINDOWS_SANDBOX) {
      cleanNextBuildArtifacts();
      build = spawnNpm(['run', 'build'], effectiveEnv);
      const buildExit = await waitForExit(build);
      build = null;

      if (receivedSignal) {
        throw new Error(`QA runner interrupted by ${receivedSignal}.`);
      }
      if (buildExit !== 0) {
        const error = new Error('QA runner aborted: production build failed before start mode.');
        error.exitCode = buildExit;
        throw error;
      }
    }

    const startArgs = effectiveServerMode === 'start' ? ['start', '-p', String(PORT)] : ['dev', '-p', String(PORT)];
    const startQaServer = () =>
      IS_CODEX_WINDOWS_SANDBOX
        ? spawnNext(startArgs, effectiveEnv)
        : spawnNpm(['run', ...startArgs.slice(0, 1), '--', ...startArgs.slice(1)], effectiveEnv);
    const restartQaServer = async () => {
      if (!QA_ENABLE_CONTROLLED_RESTART) {
        throw new Error('QA_CONTROLLED_RESTART_NOT_ENABLED');
      }
      if (restartInFlight) return restartInFlight;

      restartInFlight = (async () => {
        if (!server) throw new Error('QA_CONTROLLED_RESTART_SERVER_NOT_OWNED');
        await killProcessTree(server);
        server = null;
        await waitForPortToClose(PORT);
        server = startQaServer();
        await waitForServerReady(server, PORT);
      })();

      try {
        await restartInFlight;
      } finally {
        restartInFlight = null;
      }
    };

    server = portAlreadyOpen ? null : startQaServer();

    await waitForServerReady(server, PORT);
    if (receivedSignal) {
      throw new Error(`QA runner interrupted by ${receivedSignal}.`);
    }

    if (QA_ENABLE_CONTROLLED_RESTART) {
      controlledRestart = await startControlledRestartServer(restartQaServer);
    }

    const qaEnv = {
      ...effectiveEnv,
      QA_BASE_URL: BASE_URL,
      ...(controlledRestart
        ? {
            QA_CONTROLLED_RESTART_URL: controlledRestart.url,
            QA_CONTROLLED_RESTART_TOKEN: controlledRestart.token,
          }
        : {}),
    };

    qa = spawn(process.execPath, [QA_SCRIPT], {
      stdio: 'inherit',
      env: qaEnv,
      windowsHide: process.platform === 'win32',
    });

    const exitCode = await waitForExit(qa);
    qa = null;

    if (receivedSignal) {
      throw new Error(`QA runner interrupted by ${receivedSignal}.`);
    }
    if (exitCode !== 0) {
      const error = new Error(`QA runner aborted: QA script exited with code ${exitCode}.`);
      error.exitCode = exitCode;
      throw error;
    }
  } catch (error) {
    lifecycleError = error;
    throw error;
  } finally {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);

    const cleanupErrors = [];
    try {
      await closeControlServer(controlledRestart?.controlServer);
    } catch (error) {
      cleanupErrors.push(`failed to close controlled restart server: ${String(error)}`);
    }

    for (const child of [qa, server, build]) {
      await killProcessTree(child);
    }

    if (versionedFileSnapshots) {
      try {
        restoreVersionedFiles(versionedFileSnapshots);
      } catch (error) {
        cleanupErrors.push(`failed to restore versioned files: ${String(error)}`);
      }
    }

    try {
      cleanIsolatedNextArtifacts();
    } catch (error) {
      cleanupErrors.push(`failed to clean isolated Next artifacts: ${String(error)}`);
    }

    if (cleanupErrors.length > 0) {
      const cleanupError = new Error(`QA runner cleanup failed: ${cleanupErrors.join('; ')}`);
      if (lifecycleError) {
        console.warn(cleanupError);
      } else {
        throw cleanupError;
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = Number.isInteger(error?.exitCode) ? error.exitCode : 1;
});
