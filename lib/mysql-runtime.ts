import { readFileSync } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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
    await pool.execute(statement);
  }
}

async function validateMinimumSchema(pool: Pool) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN ('orders','payments','catalog_items','tickets','production_jobs','shipments')`
  );
  const count = Number(rows[0]?.count ?? 0);
  if (count < 6) {
    throw new Error('schema_validation_failed:missing_required_tables');
  }
}

function ensureTmpDirForDrivers() {
  const dataDir = join(process.cwd(), '.tmp-store');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

export function shouldUseMysql() {
  const mode = process.env.PAYMENT_PERSISTENCE?.toLowerCase() ?? 'sqlite';
  return mode === 'mysql';
}

export async function getMysqlPool() {
  if (!shouldUseMysql() || !mysqlAvailable) return null;
  if (mysqlPool) return mysqlPool;

  const config = parseDatabaseUrl();
  if (!config) {
    mysqlAvailable = false;
    return null;
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
      await validateMinimumSchema(mysqlPool);
      mysqlInitialized = true;
    }
    return mysqlPool;
  } catch {
    mysqlAvailable = false;
    return null;
  }
}

export type MysqlRow = RowDataPacket;
export type MysqlResult = ResultSetHeader;
