import net from 'node:net';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.QA_PORT ?? 3200);
const QA_SCRIPT = process.env.QA_SCRIPT;
const QA_SERVER_MODE = (process.env.QA_SERVER_MODE ?? 'dev').toLowerCase();

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

async function main() {
  const portAlreadyOpen = await isPortOpen(PORT);
  const startCmd = QA_SERVER_MODE === 'start' ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`;
  const server = portAlreadyOpen
    ? null
    : spawn(startCmd, [], {
        shell: true,
        stdio: 'inherit',
        detached: process.platform !== 'win32',
      });

  try {
    await waitForPort(PORT);
    const qa = spawn(process.execPath, [QA_SCRIPT], {
      stdio: 'inherit',
      env: { ...process.env, QA_BASE_URL: BASE_URL },
    });

    const exitCode = await new Promise((resolve, reject) => {
      qa.on('exit', (code) => resolve(code ?? 1));
      qa.on('error', reject);
    });

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
