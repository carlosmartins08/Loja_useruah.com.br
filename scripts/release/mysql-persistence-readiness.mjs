import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const requiredTables = [
  'users',
  'registrations',
  'orders',
  'payments',
  'catalog_items',
  'artworks',
  'impact_reviews',
  'campaigns',
  'campaign_products',
  'referral_links',
  'referral_events',
  'tickets',
  'production_jobs',
  'shipments',
];

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((entry) => new RegExp(`^${name}\\s*=`).test(entry));
  return line?.replace(new RegExp(`^${name}\\s*=\\s*`), '').trim().replace(/^['"]|['"]$/g, '');
}

function parseMysqlUrl(raw) {
  if (!raw || !raw.startsWith('mysql://')) throw new Error('DATABASE_URL_mysql_required');
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function migrationFiles() {
  const baseline = join(root, 'infra', 'mysql', 'init', '001_payments.sql');
  const directory = join(root, 'infra', 'mysql', 'migrations');
  const names = existsSync(directory) ? readdirSync(directory).filter((name) => /^\d+_[^/]+\.sql$/.test(name)).sort() : [];
  return [
    { version: '001', name: '001_payments.sql', path: baseline },
    ...names.map((name) => ({ version: name.split('_', 1)[0], name, path: join(directory, name) })),
  ].map((file) => ({ ...file, checksum: createHash('sha256').update(readFileSync(file.path, 'utf8')).digest('hex') }));
}

function isExternalUrl(value) {
  return /^https:\/\//i.test(String(value ?? '')) && !/localhost|127\.0\.0\.1/i.test(String(value));
}

async function run() {
  const persistence = String(envValue('PAYMENT_PERSISTENCE') ?? '').toLowerCase();
  const environment = String(envValue('APP_ENVIRONMENT') ?? envValue('DEPLOY_ENV') ?? 'local_controlled').toLowerCase();
  const baseUrl = envValue('APP_BASE_URL') ?? envValue('HML_BASE_URL') ?? envValue('PUBLIC_APP_URL');
  const report = { environment, persistence, baseUrlPresent: Boolean(baseUrl), requiredTables, migrations: [] };

  if (persistence !== 'mysql') throw new Error('readiness_requires_payment_persistence_mysql');
  if ((environment === 'hml' || environment === 'homolog' || environment === 'production' || environment === 'prod') && !isExternalUrl(baseUrl)) {
    console.log(JSON.stringify({ status: 'BLOCKED_EXTERNAL_BASE_URL', ...report }, null, 2));
    process.exitCode = 2;
    return;
  }

  const db = await mysql.createConnection(parseMysqlUrl(envValue('DATABASE_URL')));
  try {
    const placeholders = requiredTables.map(() => '?').join(', ');
    const [tableRows] = await db.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`,
      requiredTables
    );
    const actualTables = new Set(tableRows.map((row) => String(row.table_name ?? row.TABLE_NAME)));
    const missingTables = requiredTables.filter((table) => !actualTables.has(table));
    if (missingTables.length > 0) throw new Error(`missing_required_tables:${missingTables.join(',')}`);

    const [migrationRows] = await db.execute('SELECT version, migration_name, checksum FROM schema_migrations ORDER BY version');
    const expected = migrationFiles();
    const appliedByVersion = new Map(migrationRows.map((row) => [String(row.version), row]));
    for (const migration of expected) {
      const applied = appliedByVersion.get(migration.version);
      if (!applied) throw new Error(`missing_schema_migration:${migration.name}`);
      if (String(applied.checksum) !== migration.checksum) throw new Error(`schema_migration_checksum_mismatch:${migration.name}`);
      report.migrations.push({ version: migration.version, name: migration.name, status: 'applied' });
    }
    console.log(JSON.stringify({ status: 'PASS', ...report, actualTableCount: actualTables.size }, null, 2));
  } finally {
    await db.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', error: String(error) }, null, 2));
  process.exit(1);
});
