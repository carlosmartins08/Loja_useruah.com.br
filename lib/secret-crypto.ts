import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getMasterKey() {
  const raw = process.env.CREDENTIALS_MASTER_KEY?.trim() || process.env.SESSION_SECRET?.trim() || 'dev-insecure-credentials-key';
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const key = getMasterKey();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(cipherText: string) {
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

