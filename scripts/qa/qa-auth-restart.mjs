import { spawn } from 'node:child_process';
import { join } from 'node:path';

const port = Number(process.env.QA_PORT ?? 3344);
const baseUrl = `http://localhost:${port}`;
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60000) {
    if (child.exitCode !== null) throw new Error(`server exited before readiness: ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/auth/session`);
      if (response.ok) return;
    } catch {
      // keep polling until the timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`server readiness timeout at ${baseUrl}`);
}

function startServer() {
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    env: { ...process.env, QA_SCRIPT: process.env.QA_SCRIPT ?? 'scripts/qa/qa-auth-restart.mjs' },
    stdio: 'inherit',
    windowsHide: process.platform === 'win32',
  });
  return { child, ready: waitForServer(child) };
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 5000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill();
  });
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore non-json responses
  }
  return { response, data, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? null };
}

async function run() {
  const suffix = Date.now();
  const email = `qa-restart-${suffix}@useruah.com.br`;
  const password = 'qaRestart123';
  const report = [];

  const first = startServer();
  await first.ready;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      persona: 'ALMA',
      fullName: `QA Restart ${suffix}`,
      email,
      password,
      termsAccepted: true,
      draft: { phone: '11999999999' },
    }),
  });
  assert(registration.response.status === 201, `register expected 201, got ${registration.response.status}`);
  const userId = registration.data?.session?.userId;
  assert(typeof userId === 'string' && userId.length > 0, 'registered userId missing');
  await stopServer(first.child);
  report.push('AUTH-RESTART-01 identity created before process restart');

  const second = startServer();
  try {
    await second.ready;
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert(login.response.status === 200, `login after restart expected 200, got ${login.response.status}`);
    assert(login.data?.session?.userId === userId, 'login after restart returned a different user');
    report.push('AUTH-RESTART-02 login resolved the same durable identity after restart');

    const persistedRegistration = await request('/api/auth/registration/me', {
      headers: { cookie: login.cookie ?? '' },
    });
    assert(persistedRegistration.response.status === 200, `registration/me after restart expected 200, got ${persistedRegistration.response.status}`);
    assert(persistedRegistration.data?.registration?.registrationId, 'registration missing after restart');
    report.push('AUTH-RESTART-03 registration persisted across process restart');
  } finally {
    await stopServer(second.child);
  }

  console.log(JSON.stringify({ status: 'PASS', baseUrl, persistence: process.env.PAYMENT_PERSISTENCE ?? 'default', report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
