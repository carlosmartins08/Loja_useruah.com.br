import net from 'node:net';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.QA_PORT ?? 3200);
const QA_SCRIPT = process.env.QA_SCRIPT;
const QA_SERVER_MODE = (process.env.QA_SERVER_MODE ?? 'dev').toLowerCase();
const QA_REUSE_EXISTING = String(process.env.QA_REUSE_EXISTING ?? 'false').toLowerCase() === 'true';

if (!QA_SCRIPT) {
  console.error('QA_SCRIPT is required (example: scripts/qa-catalog-lifecycle.mjs)');
  process.exit(1);
}

const BASE_URL = `http://localhost:${PORT}`;

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

function spawnNpm(args) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return spawn(process.execPath, [npmExecPath, ...args], {
      stdio: 'inherit',
      windowsHide: process.platform === 'win32',
      detached: process.platform !== 'win32',
    });
  }

  return spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    stdio: 'inherit',
    windowsHide: process.platform === 'win32',
    detached: process.platform !== 'win32',
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
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

  const startArgs = QA_SERVER_MODE === 'start' ? ['run', 'start', '--', '-p', String(PORT)] : ['run', 'dev', '--', '-p', String(PORT)];
  if (!portAlreadyOpen && QA_SERVER_MODE === 'start') {
    const build = spawnNpm(['run', 'build']);
    const buildExit = await waitForExit(build);
    if (buildExit !== 0) {
      console.error('QA runner aborted: production build failed before start mode.');
      process.exit(buildExit);
    }
  }
  const server = portAlreadyOpen ? null : spawnNpm(startArgs);

  try {
    await waitForPort(PORT);
    const qa = spawn(process.execPath, [QA_SCRIPT], {
      stdio: 'inherit',
      env: { ...process.env, QA_BASE_URL: BASE_URL },
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
