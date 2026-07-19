import { readFileSync } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readdirSync } from 'fs';
import { createHash } from 'crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

type MysqlModule = {
  createPool: (config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
  }) => Pool;
};

let mysqlPool: Pool | null = null;
let mysqlAvailable = true;
let mysqlInitialized = false;

const OFFICIAL_SCHEMA_PATH = join(process.cwd(), 'infra', 'mysql', 'init', '001_payments.sql');
const MIGRATIONS_DIR = join(process.cwd(), 'infra', 'mysql', 'migrations');

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'mysql:') return null;
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

function readOfficialSchemaStatements() {
  const sql = readFileSync(OFFICIAL_SCHEMA_PATH, 'utf8');
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

async function applyOfficialSchema(pool: Pool) {
  if (!existsSync(OFFICIAL_SCHEMA_PATH)) {
    throw new Error(`official_schema_not_found:${OFFICIAL_SCHEMA_PATH}`);
  }

  const statements = readOfficialSchemaStatements();
  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
      const isExistingIndex = code === 'ER_DUP_KEYNAME' && /^CREATE INDEX\b/i.test(statement);
      const isExistingColumn = code === 'ER_DUP_FIELDNAME' && /^ALTER TABLE\b.*\bADD COLUMN\b/i.test(statement);
      if (!isExistingIndex && !isExistingColumn) throw error;
    }
  }
}

function readMigrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_[^/]+\.sql$/.test(name))
    .sort()
    .map((name) => {
      const path = join(MIGRATIONS_DIR, name);
      const sql = readFileSync(path, 'utf8');
      return {
        version: name.split('_', 1)[0],
        name,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    });
}

async function applyVersionedMigrations(pool: Pool) {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(32) PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL,
      checksum CHAR(64) NOT NULL,
      applied_at DATETIME(3) NOT NULL
    )`
  );

  const [appliedRows] = await pool.execute<RowDataPacket[]>('SELECT version, checksum FROM schema_migrations');
  const applied = new Map(appliedRows.map((row) => [String(row.version), String(row.checksum)]));

  for (const migration of readMigrationFiles()) {
    const previousChecksum = applied.get(migration.version);
    if (previousChecksum) {
      if (previousChecksum !== migration.checksum) {
        throw new Error(`schema_migration_checksum_mismatch:${migration.name}`);
      }
      continue;
    }

    for (const statement of migration.sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${s};`)) {
      try {
        await pool.execute(statement);
      } catch (error) {
        const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
        const isExistingIndex = code === 'ER_DUP_KEYNAME' && /^CREATE INDEX\b/i.test(statement);
        const isExistingColumn = code === 'ER_DUP_FIELDNAME' && /^ALTER TABLE\b.*\bADD COLUMN\b/i.test(statement);
        if (!isExistingIndex && !isExistingColumn) throw error;
      }
    }

    await pool.execute(
      'INSERT INTO schema_migrations (version, migration_name, checksum, applied_at) VALUES (?, ?, ?, ?)',
      [migration.version, migration.name, migration.checksum, new Date()]
    );
  }
}

async function validateMinimumSchema(pool: Pool) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN ('users','registrations','orders','payments','catalog_items','artworks','impact_reviews','campaigns','campaign_products','referral_links','referral_events','tickets','production_jobs','shipments')`
  );
  const count = Number(rows[0]?.count ?? 0);
  if (count < 14) {
    throw new Error('schema_validation_failed:missing_required_tables');
  }
}

function ensureTmpDirForDrivers() {
  const dataDir = join(process.cwd(), '.tmp-store');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function normalizeEnvironment(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function isExternalBaseUrl(value: string | undefined) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isProductionLikeEnvironment() {
  const markedEnvironment = [
    process.env.NODE_ENV,
    process.env.APP_ENV,
    process.env.APP_ENVIRONMENT,
    process.env.DEPLOY_ENV,
    process.env.VERCEL_ENV,
  ].some((value) => {
    const normalized = normalizeEnvironment(value);
    return ['production', 'prod', 'hml', 'homolog', 'homologacao', 'staging', 'stage'].includes(normalized);
  });

  const externalBaseConfigured = [process.env.HML_BASE_URL, process.env.APP_BASE_URL, process.env.PUBLIC_APP_URL].some((value) =>
    isExternalBaseUrl(value)
  );

  return markedEnvironment || externalBaseConfigured;
}

function assertProductionPersistenceConfiguration() {
  if (!isProductionLikeEnvironment()) return;

  if (normalizeEnvironment(process.env.NODE_ENV) !== 'production') {
    throw new Error('node_env_production_required_for_production_environment');
  }

  const mode = normalizeEnvironment(process.env.PAYMENT_PERSISTENCE) || 'sqlite';
  if (mode !== 'mysql') {
    throw new Error('mysql_persistence_required_in_production_environment');
  }

  if (!parseDatabaseUrl()) {
    throw new Error('mysql_database_url_required_in_production_environment');
  }
}

export function shouldUseMysql() {
  assertProductionPersistenceConfiguration();
  const mode = process.env.PAYMENT_PERSISTENCE?.toLowerCase() ?? 'sqlite';
  return mode === 'mysql';
}

export async function getMysqlPool() {
  if (!shouldUseMysql()) return null;
  if (!mysqlAvailable) {
    throw new Error('mysql_runtime_unavailable');
  }
  if (mysqlPool) return mysqlPool;

  const config = parseDatabaseUrl();
  if (!config) {
    mysqlAvailable = false;
    throw new Error('mysql_database_url_invalid');
  }

  ensureTmpDirForDrivers();

  try {
    const mysql = (await import('mysql2/promise')) as MysqlModule;
    mysqlPool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    if (!mysqlInitialized) {
      await applyOfficialSchema(mysqlPool);
      await applyVersionedMigrations(mysqlPool);
      await validateMinimumSchema(mysqlPool);
      mysqlInitialized = true;
    }
    return mysqlPool;
  } catch {
    mysqlAvailable = false;
    throw new Error('mysql_runtime_initialization_failed');
  }
}

export type MysqlRow = RowDataPacket;
export type MysqlResult = ResultSetHeader;
