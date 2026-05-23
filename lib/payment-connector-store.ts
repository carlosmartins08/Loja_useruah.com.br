import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { decryptSecret, encryptSecret } from '@/lib/secret-crypto';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';
import type { PaymentProviderKey } from '@/lib/payments';

export interface PaymentConnectorConfig {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
}

interface State {
  records: Record<string, { provider: PaymentProviderKey; enabled: boolean; encryptedConfig: string; updatedAt: string; updatedBy: string }>;
}

function readState(): State {
  return readStoreFile<State>('payment-connectors', { records: {} });
}

function writeState(value: State) {
  writeStoreFile('payment-connectors', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return new Date().toISOString();
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function sanitizeSettings(settings: Record<string, string>) {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!value.trim()) continue;
    safe[key] = value.trim();
  }
  return safe;
}

function maskSettings(settings: Record<string, string>) {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    const lower = key.toLowerCase();
    const sensitive = lower.includes('secret') || lower.includes('key') || lower.includes('token') || lower.includes('password');
    masked[key] = sensitive ? '********' : value;
  }
  return masked;
}

export async function upsertPaymentConnectorConfig(input: {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
  updatedBy: string;
}) {
  const now = new Date().toISOString();
  const settings = sanitizeSettings(input.settings);
  const encryptedConfig = encryptSecret(JSON.stringify(settings));

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO payment_connector_configs (id, provider, enabled, encrypted_config, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), encrypted_config = VALUES(encrypted_config), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)`,
      [randomUUID(), input.provider, input.enabled ? 1 : 0, encryptedConfig, toMysqlDatetime(now), input.updatedBy]
    );
    return;
  }

  const state = readState();
  state.records[input.provider] = {
    provider: input.provider,
    enabled: input.enabled,
    encryptedConfig,
    updatedAt: now,
    updatedBy: input.updatedBy,
  };
  writeState(state);
}

export async function listPaymentConnectorConfigs() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT provider, enabled, encrypted_config, updated_at, updated_by FROM payment_connector_configs ORDER BY provider ASC`
    );
    return rows.map((row) => {
      const settingsRaw = decryptSecret(String(row.encrypted_config));
      const settings = JSON.parse(settingsRaw) as Record<string, string>;
      const config: PaymentConnectorConfig = {
        provider: String(row.provider) as PaymentProviderKey,
        enabled: Number(row.enabled) === 1,
        settings: maskSettings(settings),
        updatedAt: mysqlDatetimeToIso(row.updated_at),
        updatedBy: String(row.updated_by),
      };
      return config;
    });
  }

  const state = readState();
  return Object.values(state.records).map((row) => {
    const settingsRaw = decryptSecret(row.encryptedConfig);
    const settings = JSON.parse(settingsRaw) as Record<string, string>;
    const config: PaymentConnectorConfig = {
      provider: row.provider,
      enabled: row.enabled,
      settings: maskSettings(settings),
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
    return config;
  });
}

export async function getPaymentConnectorConfigPlain(provider: PaymentProviderKey) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT provider, enabled, encrypted_config, updated_at, updated_by FROM payment_connector_configs WHERE provider = ? LIMIT 1`,
      [provider]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      provider: String(row.provider) as PaymentProviderKey,
      enabled: Number(row.enabled) === 1,
      settings: JSON.parse(decryptSecret(String(row.encrypted_config))) as Record<string, string>,
      updatedAt: mysqlDatetimeToIso(row.updated_at),
      updatedBy: String(row.updated_by),
    };
  }

  const state = readState();
  const row = state.records[provider];
  if (!row) return null;
  return {
    provider: row.provider,
    enabled: row.enabled,
    settings: JSON.parse(decryptSecret(row.encryptedConfig)) as Record<string, string>,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}


