#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const providerSmokeCommands = {
  gateway_real: 'qa:gateway-real:smoke',
  inter: 'qa:inter:smoke',
  infinitepay: 'qa:infinitepay:smoke',
  mercadopago: 'qa:mercadopago:smoke',
  pagarme: 'qa:pagarme:smoke',
  cielo: 'qa:cielo:smoke',
  stripe: 'qa:stripe:smoke',
};
const directProviders = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];
const providerMode = String(process.env.PAYMENT_PROVIDER ?? '').trim().toLowerCase();
const rawTargetProvider = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
const targetProvider =
  providerMode === 'gateway_real'
    ? directProviders.includes(rawTargetProvider)
      ? rawTargetProvider
      : 'gateway_real'
    : providerMode;

if (!(targetProvider in providerSmokeCommands)) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'invalid_provider_selection',
        expected: Object.keys(providerSmokeCommands),
        paymentProvider: providerMode || null,
        paymentGatewayTarget: rawTargetProvider || null,
        resolvedProvider: targetProvider || null,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const steps = [
  { id: 'STEP-01', cmd: ['run', 'check'] },
  { id: 'STEP-02', cmd: ['run', 'alert:critical'] },
  { id: 'STEP-03', cmd: ['run', 'qa:providers:ready'] },
  { id: 'STEP-04', cmd: ['run', providerSmokeCommands[targetProvider]] },
  { id: 'STEP-05', cmd: ['run', 'qa:payments21'] },
  { id: 'STEP-06', cmd: ['run', 'qa:exceptions'] },
];

const report = [];
for (const step of steps) {
  const startedAt = new Date().toISOString();
  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', `npm ${step.cmd.join(' ')}`], {
          env: process.env,
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        })
      : spawnSync('npm', step.cmd, {
          env: process.env,
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });

  report.push({
    step: step.id,
    command: `npm ${step.cmd.join(' ')}`,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    startedAt,
    finishedAt: new Date().toISOString(),
  });

  if (result.status !== 0) {
    console.error(
      JSON.stringify(
      {
        status: 'FAIL',
        targetProvider,
        paymentProvider: providerMode || null,
        failedStep: step.id,
        command: `npm ${step.cmd.join(' ')}`,
        runnerError: result.error ? String(result.error) : null,
          report,
          stdoutTail: (result.stdout ?? '').slice(-3000),
          stderrTail: (result.stderr ?? '').slice(-3000),
        },
        null,
        2
      )
    );
    process.exit(result.status ?? 1);
  }
}

console.log(
  JSON.stringify(
      {
        status: 'PASS',
        targetProvider,
        paymentProvider: providerMode || null,
        report,
        next: ['Registrar evidencia em docs/EXECUTION_TRACKING.md', 'Registrar decisao/governanca em docs/CHANGELOG_GOVERNANCE.md'],
      },
    null,
    2
  )
);
