import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { decryptSecret, encryptSecret } from '@/lib/secret-crypto';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';
import type { PaymentProviderKey } from '@/lib/payments';

export interface PaymentConnectorConfig {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
  isDefault: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface State {
  records: Record<string, { provider: PaymentProviderKey; enabled: boolean; encryptedConfig: string; updatedAt: string; updatedBy: string }>;
  defaultProvider?: PaymentProviderKey;
  previousDefaultProvider?: PaymentProviderKey;
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

function isMysqlMissingTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as { message?: unknown }).message) : '';
  return message.includes('doesn\'t exist') || message.includes('ER_NO_SUCH_TABLE');
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
    if (!input.enabled) {
      try {
        const [prefRows] = await mysql.execute<MysqlRow[]>(
          `SELECT default_provider FROM payment_connector_preferences WHERE id = 'singleton' LIMIT 1`
        );
        const currentDefault = prefRows[0]?.default_provider ? (String(prefRows[0].default_provider) as PaymentProviderKey) : null;
        if (currentDefault === input.provider) {
          const [candidateRows] = await mysql.execute<MysqlRow[]>(
            `SELECT provider FROM payment_connector_configs WHERE enabled = 1 AND provider <> ? ORDER BY updated_at DESC LIMIT 1`,
            [input.provider]
          );
          const candidate = candidateRows[0]?.provider ? (String(candidateRows[0].provider) as PaymentProviderKey) : null;
          if (candidate) {
            await setDefaultPaymentConnector(candidate, input.updatedBy);
          }
        }
      } catch (error) {
        if (!isMysqlMissingTable(error)) throw error;
      }
    }
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
  if (!input.enabled && state.defaultProvider === input.provider) {
    const candidate = Object.values(state.records)
      .filter((item) => item.provider !== input.provider && item.enabled)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (candidate) {
      state.previousDefaultProvider = state.defaultProvider;
      state.defaultProvider = candidate.provider;
    }
  }
  writeState(state);
}

export async function listPaymentConnectorConfigs() {
  const preference = await getPaymentConnectorPreference();
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
        isDefault: preference.defaultProvider === String(row.provider),
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
      isDefault: preference.defaultProvider === row.provider,
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

export async function getEnabledPaymentConnectorProviders() {
  const configs = await listPaymentConnectorConfigs();
  return configs.filter((row) => row.enabled).map((row) => row.provider);
}

export async function resolveDefaultPaymentProvider(fallback: PaymentProviderKey = 'sandbox') {
  const [preference, enabled] = await Promise.all([getPaymentConnectorPreference(), getEnabledPaymentConnectorProviders()]);
  if (preference.defaultProvider && enabled.includes(preference.defaultProvider)) {
    return preference.defaultProvider;
  }
  return enabled[0] ?? fallback;
}

export async function getPaymentConnectorPreference() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    try {
      const [rows] = await mysql.execute<MysqlRow[]>(
        `SELECT default_provider, previous_default_provider, updated_at, updated_by
         FROM payment_connector_preferences WHERE id = 'singleton' LIMIT 1`
      );
      const row = rows[0];
      return {
        defaultProvider: row?.default_provider ? (String(row.default_provider) as PaymentProviderKey) : null,
        previousDefaultProvider: row?.previous_default_provider ? (String(row.previous_default_provider) as PaymentProviderKey) : null,
        updatedAt: row?.updated_at ? mysqlDatetimeToIso(row.updated_at) : null,
        updatedBy: row?.updated_by ? String(row.updated_by) : null,
      };
    } catch (error) {
      if (!isMysqlMissingTable(error)) throw error;
    }
  }

  const state = readState();
  return {
    defaultProvider: state.defaultProvider ?? null,
    previousDefaultProvider: state.previousDefaultProvider ?? null,
    updatedAt: null,
    updatedBy: null,
  };
}

export async function setDefaultPaymentConnector(provider: PaymentProviderKey, updatedBy: string) {
  const now = new Date().toISOString();
  const mysql = await getMysqlPool();
  let enabledValidatedInMysql = false;
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT enabled FROM payment_connector_configs WHERE provider = ? LIMIT 1`,
      [provider]
    );
    if (!rows[0] || Number(rows[0].enabled) !== 1) {
      return { ok: false as const, reason: 'provider_not_enabled' };
    }
    enabledValidatedInMysql = true;
    try {
      const [prefRows] = await mysql.execute<MysqlRow[]>(
        `SELECT default_provider FROM payment_connector_preferences WHERE id = 'singleton' LIMIT 1`
      );
      const previousDefault = prefRows[0]?.default_provider ? String(prefRows[0].default_provider) : null;
      await mysql.execute<MysqlResult>(
        `INSERT INTO payment_connector_preferences (id, default_provider, previous_default_provider, updated_at, updated_by)
         VALUES ('singleton', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           default_provider = VALUES(default_provider),
           previous_default_provider = VALUES(previous_default_provider),
           updated_at = VALUES(updated_at),
           updated_by = VALUES(updated_by)`,
        [provider, previousDefault, toMysqlDatetime(now), updatedBy]
      );
      return { ok: true as const, previousDefault: previousDefault as PaymentProviderKey | null };
    } catch (error) {
      if (!isMysqlMissingTable(error)) throw error;
    }
  }

  const state = readState();
  const row = state.records[provider];
  if (!enabledValidatedInMysql && (!row || !row.enabled)) {
    return { ok: false as const, reason: 'provider_not_enabled' };
  }
  state.previousDefaultProvider = state.defaultProvider;
  state.defaultProvider = provider;
  writeState(state);
  return { ok: true as const, previousDefault: state.previousDefaultProvider ?? null };
}

export async function rollbackDefaultPaymentConnector(updatedBy: string) {
  const preference = await getPaymentConnectorPreference();
  const previous = preference.previousDefaultProvider;
  if (!previous) {
    return { ok: false as const, reason: 'no_previous_default' };
  }
  const switched = await setDefaultPaymentConnector(previous, updatedBy);
  if (!switched.ok) {
    return switched;
  }

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    try {
      await mysql.execute<MysqlResult>(
        `UPDATE payment_connector_preferences
         SET previous_default_provider = ?, updated_at = ?, updated_by = ?
         WHERE id = 'singleton'`,
        [preference.defaultProvider, toMysqlDatetime(new Date().toISOString()), updatedBy]
      );
      return { ok: true as const, provider: previous };
    } catch (error) {
      if (!isMysqlMissingTable(error)) throw error;
    }
  }

  const state = readState();
  const oldCurrent = state.previousDefaultProvider ?? null;
  state.previousDefaultProvider = preference.defaultProvider ?? undefined;
  writeState(state);
  return { ok: true as const, provider: previous, previous: oldCurrent };
}


