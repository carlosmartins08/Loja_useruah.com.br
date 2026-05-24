#!/usr/bin/env node
import { createDecipheriv, createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function hasValue(value) {
  return Boolean(value && String(value).trim());
}

function getMasterKey() {
  const raw = process.env.CREDENTIALS_MASTER_KEY?.trim() || process.env.SESSION_SECRET?.trim() || 'dev-insecure-credentials-key';
  return createHash('sha256').update(raw).digest();
}

function decryptSecret(cipherText) {
  const raw = Buffer.from(cipherText, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const body = raw.subarray(28);
  const key = getMasterKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(body), decipher.final()]);
  return decrypted.toString('utf8');
}

function readConnectorSettings(provider) {
  const file = join(process.cwd(), '.tmp-store', 'payment-connectors.json');
  if (!existsSync(file)) return null;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    const row = raw?.records?.[provider];
    if (!row?.encryptedConfig) return null;
    const settings = JSON.parse(decryptSecret(String(row.encryptedConfig)));
    return { enabled: Boolean(row.enabled), settings: settings && typeof settings === 'object' ? settings : {} };
  } catch {
    return null;
  }
}

export function resolveProviderValue(provider, envKey, settingKey) {
  const connector = readConnectorSettings(provider);
  const fromConnector = connector?.settings?.[settingKey];
  const fromEnv = process.env[envKey];
  if (hasValue(fromConnector)) return String(fromConnector).trim();
  if (hasValue(fromEnv)) return String(fromEnv).trim();
  return '';
}

export function providerConfigState(provider, requiredMappings) {
  const missing = requiredMappings
    .filter((mapping) => !resolveProviderValue(provider, mapping.env, mapping.setting))
    .map((mapping) => mapping.env);
  return {
    missing,
    configured: missing.length === 0,
  };
}

