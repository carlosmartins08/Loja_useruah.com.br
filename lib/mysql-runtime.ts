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

async function ensureSchema(pool: Pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64) NOT NULL,
      items_json JSON NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      status VARCHAR(24) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      paid_at DATETIME(3) NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS production_jobs (
      production_job_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL UNIQUE,
      status VARCHAR(24) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS shipments (
      shipment_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL UNIQUE,
      tracking_code VARCHAR(128) NOT NULL,
      carrier VARCHAR(64) NOT NULL,
      status VARCHAR(24) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      customer_id VARCHAR(64) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(24) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      messages_json JSON NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS commissions (
      commission_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      owner_id VARCHAR(64) NOT NULL,
      owner_role VARCHAR(32) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(8) NOT NULL,
      status VARCHAR(24) NOT NULL,
      source_key VARCHAR(128) NOT NULL UNIQUE,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payouts (
      payout_id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      owner_role VARCHAR(32) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(8) NOT NULL,
      status VARCHAR(24) NOT NULL,
      commission_ids_json JSON NOT NULL,
      idempotency_key VARCHAR(128) NOT NULL UNIQUE,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      payment_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      method VARCHAR(24) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(8) NOT NULL,
      status VARCHAR(24) NOT NULL,
      provider_reference VARCHAR(128) NOT NULL UNIQUE,
      created_at DATETIME(3) NOT NULL,
      approved_at DATETIME(3) NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payment_idempotency (
      idempotency_key VARCHAR(128) PRIMARY KEY,
      payment_id VARCHAR(64) NOT NULL,
      CONSTRAINT fk_payment_idempotency_payment
        FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
        ON DELETE CASCADE
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payment_events (
      event_id VARCHAR(64) PRIMARY KEY,
      payment_id VARCHAR(64) NOT NULL,
      event_name VARCHAR(80) NOT NULL,
      from_status VARCHAR(24) NOT NULL,
      to_status VARCHAR(24) NOT NULL,
      meta JSON NULL,
      created_at DATETIME(3) NOT NULL,
      CONSTRAINT fk_payment_events_payment
        FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
        ON DELETE CASCADE
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id VARCHAR(128) PRIMARY KEY,
      processed_at DATETIME(3) NOT NULL
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS provider_recipients (
      id VARCHAR(64) PRIMARY KEY,
      entity_type VARCHAR(24) NOT NULL,
      entity_id VARCHAR(64) NOT NULL,
      provider VARCHAR(32) NOT NULL,
      provider_recipient_id VARCHAR(128) NOT NULL,
      status VARCHAR(24) NOT NULL,
      document VARCHAR(64) NULL,
      bank_account_reference VARCHAR(128) NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      UNIQUE KEY uq_provider_recipient_entity (entity_type, entity_id, provider)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS provider_webhook_events (
      id VARCHAR(64) PRIMARY KEY,
      provider VARCHAR(32) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      provider_event_id VARCHAR(128) NOT NULL,
      provider_reference VARCHAR(128) NULL,
      payload_json JSON NOT NULL,
      processed TINYINT(1) NOT NULL DEFAULT 0,
      processed_at DATETIME(3) NULL,
      error_message TEXT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      UNIQUE KEY uq_provider_event (provider, provider_event_id),
      INDEX idx_provider_reference (provider_reference)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS integration_logs (
      id VARCHAR(64) PRIMARY KEY,
      provider VARCHAR(32) NOT NULL,
      action VARCHAR(80) NOT NULL,
      request_payload_json JSON NULL,
      response_payload_json JSON NULL,
      status_code INT NULL,
      success TINYINT(1) NOT NULL,
      error_message TEXT NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_integration_provider_action (provider, action)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS refunds (
      refund_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      payment_id VARCHAR(64) NOT NULL,
      status VARCHAR(24) NOT NULL,
      reason TEXT NOT NULL,
      requested_by VARCHAR(64) NOT NULL,
      approved_by VARCHAR(64) NULL,
      rejected_by VARCHAR(64) NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      idempotency_key VARCHAR(128) NOT NULL UNIQUE,
      INDEX idx_refunds_order (order_id),
      INDEX idx_refunds_payment (payment_id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS chargeback_events (
      chargeback_id VARCHAR(64) PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL UNIQUE,
      payment_id VARCHAR(64) NOT NULL,
      order_id VARCHAR(64) NOT NULL,
      reason TEXT NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_chargebacks_payment (payment_id),
      INDEX idx_chargebacks_order (order_id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS terms_acceptances (
      acceptance_id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      entity_type VARCHAR(32) NOT NULL,
      entity_id VARCHAR(64) NOT NULL,
      term_type VARCHAR(64) NOT NULL,
      term_version VARCHAR(32) NOT NULL,
      accepted_at DATETIME(3) NOT NULL,
      ip_address VARCHAR(64) NULL,
      user_agent TEXT NULL,
      INDEX idx_terms_user (user_id),
      INDEX idx_terms_type_version (term_type, term_version)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payment_splits (
      split_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      order_item_id VARCHAR(64) NOT NULL,
      payment_id VARCHAR(64) NOT NULL,
      recipient_type VARCHAR(32) NOT NULL,
      recipient_id VARCHAR(64) NOT NULL,
      provider_recipient_id VARCHAR(128) NULL,
      gross_amount DECIMAL(12, 2) NOT NULL,
      split_amount DECIMAL(12, 2) NOT NULL,
      split_percentage DECIMAL(8, 4) NOT NULL,
      net_amount DECIMAL(12, 2) NOT NULL,
      liable TINYINT(1) NOT NULL DEFAULT 0,
      charge_processing_fee TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(24) NOT NULL,
      provider_reference VARCHAR(128) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      INDEX idx_splits_payment (payment_id),
      INDEX idx_splits_order (order_id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS license_events (
      license_event_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      order_item_id VARCHAR(64) NOT NULL,
      artist_id VARCHAR(64) NOT NULL,
      artwork_id VARCHAR(64) NOT NULL,
      supplier_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      buyer_id VARCHAR(64) NOT NULL,
      license_type VARCHAR(64) NOT NULL,
      quantity INT NOT NULL,
      gross_sale_amount DECIMAL(12, 2) NOT NULL,
      artist_percentage DECIMAL(8, 4) NOT NULL,
      artist_license_amount DECIMAL(12, 2) NOT NULL,
      platform_commission_amount DECIMAL(12, 2) NOT NULL,
      supplier_amount DECIMAL(12, 2) NOT NULL,
      payment_status VARCHAR(24) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      paid_at DATETIME(3) NULL,
      canceled_at DATETIME(3) NULL,
      refunded_at DATETIME(3) NULL,
      INDEX idx_license_order (order_id),
      INDEX idx_license_artist (artist_id)
    )
  `);
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
      await ensureSchema(mysqlPool);
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
