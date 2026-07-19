import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const baselinePath = join(root, 'infra', 'mysql', 'init', '001_payments.sql');
const migrationsDir = join(root, 'infra', 'mysql', 'migrations');
const planOnly = process.argv.includes('--plan');

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((entry) => new RegExp(`^${name}\\s*=`).test(entry));
  return line?.replace(new RegExp(`^${name}\\s*=\\s*`), '').trim().replace(/^['"]|['"]$/g, '');
}

function statementsFrom(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

function migrationFiles() {
  const files = existsSync(migrationsDir)
    ? readdirSync(migrationsDir).filter((name) => /^\d+_[^/]+\.sql$/.test(name)).sort()
    : [];
  return [
    { version: '001', name: '001_payments.sql', path: baselinePath },
    ...files.map((name) => ({ version: name.split('_', 1)[0], name, path: join(migrationsDir, name) })),
  ].map((migration) => {
    const sql = readFileSync(migration.path, 'utf8');
    return { ...migration, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  });
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

async function executeStatements(connection, statements) {
  for (const statement of statements) {
    try {
      await connection.execute(statement);
    } catch (error) {
      const code = error && typeof error === 'object' ? error.code : undefined;
      const isExistingIndex = code === 'ER_DUP_KEYNAME' && /^CREATE INDEX\b/i.test(statement);
      const isExistingColumn = code === 'ER_DUP_FIELDNAME' && /^ALTER TABLE\b.*\bADD COLUMN\b/i.test(statement);
      if (!isExistingIndex && !isExistingColumn) throw error;
    }
  }
}

async function run() {
  const migrations = migrationFiles();
  const plan = migrations.map(({ version, name, checksum }) => ({ version, name, checksum }));
  if (planOnly) {
    console.log(JSON.stringify({ status: 'PLAN', database: 'mysql', migrations: plan }, null, 2));
    return;
  }

  const connection = await mysql.createConnection(parseMysqlUrl(envValue('DATABASE_URL')));
  try {
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(32) PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at DATETIME(3) NOT NULL
      )`
    );
    const [rows] = await connection.execute('SELECT version, checksum FROM schema_migrations');
    const applied = new Map(rows.map((row) => [String(row.version), String(row.checksum)]));
    const appliedNow = [];

    for (const migration of migrations) {
      const previousChecksum = applied.get(migration.version);
      if (previousChecksum) {
        if (previousChecksum !== migration.checksum) throw new Error(`schema_migration_checksum_mismatch:${migration.name}`);
        continue;
      }

      await executeStatements(connection, statementsFrom(migration.sql));
      await connection.execute(
        'INSERT INTO schema_migrations (version, migration_name, checksum, applied_at) VALUES (?, ?, ?, ?)',
        [migration.version, migration.name, migration.checksum, new Date()]
      );
      appliedNow.push(migration.version);
    }

    console.log(JSON.stringify({ status: 'PASS', database: 'mysql', applied: appliedNow, total: migrations.length }, null, 2));
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', database: 'mysql', error: String(error) }, null, 2));
  process.exit(1);
});
