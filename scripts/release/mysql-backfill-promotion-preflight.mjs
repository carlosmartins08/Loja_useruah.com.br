import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = process.cwd();
const manifestArgument = process.argv.find((arg) => arg.startsWith('--manifest='));
const manifestPath = manifestArgument ? manifestArgument.slice('--manifest='.length) : join(root, 'artifacts', 'operations', 'backfill-promotion-manifest.json');

function fail(reason, details = {}) {
  console.log(JSON.stringify({ status: 'BLOCKED', reason, ...details }, null, 2));
  process.exitCode = 2;
}

function isIso(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function prefixesAreSafe(values) {
  return Array.isArray(values) && values.length > 0 && values.every((value) => hasValue(value) && !/[*?]/.test(value));
}

if (!existsSync(manifestPath)) {
  fail('manifest_missing', { manifestPath });
} else {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    fail('manifest_invalid_json', { manifestPath });
  }

  if (manifest) {
    const source = manifest.source ?? {};
    const target = manifest.target ?? {};
    const scope = manifest.scope ?? {};
    const approval = manifest.approval ?? {};
    const missing = [];
    for (const [name, value] of Object.entries({
      changeId: manifest.changeId,
      sourceEnvironment: source.environment,
      snapshotId: source.snapshotId,
      snapshotPath: source.snapshotPath,
      snapshotSha256: source.snapshotSha256,
      capturedAt: source.capturedAt,
      operator: source.operator,
      targetEnvironment: target.environment,
      targetBaseUrl: target.baseUrl,
      databaseUrlEnv: target.databaseUrlEnv,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      changeReference: approval.changeReference,
      backupId: approval.backupId,
      rollbackPlan: approval.rollbackPlan,
    })) {
      if (!hasValue(value)) missing.push(name);
    }
    if (missing.length > 0) {
      fail('manifest_required_fields_missing', { manifestPath, missing });
    } else if (!isSha256(source.snapshotSha256)) {
      fail('snapshot_sha256_invalid', { manifestPath });
    } else if (!isIso(source.capturedAt) || !isIso(approval.approvedAt)) {
      fail('manifest_dates_invalid', { manifestPath });
    } else if (!prefixesAreSafe(scope.campaignPrefixes) || !prefixesAreSafe(scope.referralOwnerPrefixes)) {
      fail('explicit_non_wildcard_scope_required', { manifestPath });
    } else if (!existsSync(join(root, source.snapshotPath))) {
      fail('snapshot_file_missing', { manifestPath, snapshotPath: source.snapshotPath });
    } else if (createHash('sha256').update(readFileSync(join(root, source.snapshotPath)).toString()).digest('hex') !== source.snapshotSha256.toLowerCase()) {
      fail('snapshot_checksum_mismatch', { manifestPath, snapshotPath: source.snapshotPath });
    } else if (!/^https:\/\//i.test(target.baseUrl) || /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(target.baseUrl)) {
      fail('external_https_base_url_required', { manifestPath, targetEnvironment: target.environment });
    } else if (!/^(hml|homolog|prod|production)$/i.test(target.environment)) {
      fail('unsupported_target_environment', { manifestPath, targetEnvironment: target.environment });
    } else if (source.environment.toLowerCase() === target.environment.toLowerCase()) {
      fail('source_and_target_environment_must_be_distinct', { manifestPath });
    } else if (!process.env[target.databaseUrlEnv]) {
      fail('target_database_secret_missing', { manifestPath, databaseUrlEnv: target.databaseUrlEnv });
    } else {
      console.log(JSON.stringify({
        status: 'PASS',
        decision: 'READY_FOR_EXTERNAL_READINESS_ONLY',
        manifestPath,
        changeId: manifest.changeId,
        sourceEnvironment: source.environment,
        targetEnvironment: target.environment,
        targetBaseUrl: target.baseUrl,
        scope: {
          campaignPrefixes: scope.campaignPrefixes.length,
          referralOwnerPrefixes: scope.referralOwnerPrefixes.length,
        },
        databaseSecretPresent: true,
        nextAction: 'run_external_readiness_then_backfill_plan_before_any_execute',
      }, null, 2));
    }
  }
}
