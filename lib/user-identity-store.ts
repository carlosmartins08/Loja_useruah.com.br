import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { AuthSession, UserRole } from '@/lib/auth-session';
import { isUserRole } from '@/lib/auth-session';
import { getSessionRoleScope } from '@/lib/role-scope';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, isProductionLikeEnvironment, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_PREFIX = 'scrypt';

type UserStatus = 'active' | 'paused' | 'blocked';

interface StoredUser {
  userId: string;
  email: string;
  passwordHash: string;
  userName: string;
  userRole: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

interface LocalUserState {
  users: Record<string, StoredUser>;
}

interface FixtureUser {
  email: string;
  password: string;
  userId: string;
  userName: string;
  userRole: UserRole;
}

const DEV_TEST_USERS: FixtureUser[] = [
  { email: 'customer@useruah.com.br', password: 'customer123', userId: 'usr:customer@useruah.com.br', userName: 'Cliente Demo', userRole: 'customer' },
  { email: 'supplier@useruah.com.br', password: 'supplier123', userId: 'usr:supplier@useruah.com.br', userName: 'Fornecedor Demo', userRole: 'supplier' },
  { email: 'admin@useruah.com.br', password: 'admin123', userId: 'usr:admin@useruah.com.br', userName: 'Admin Demo', userRole: 'platform_admin' },
  { email: 'support@useruah.com.br', password: 'support123', userId: 'usr:support@useruah.com.br', userName: 'Suporte Demo', userRole: 'support_agent' },
  { email: 'production@useruah.com.br', password: 'production123', userId: 'usr:production@useruah.com.br', userName: 'Producao Demo', userRole: 'production_operator' },
  { email: 'finance@useruah.com.br', password: 'finance123', userId: 'usr:finance@useruah.com.br', userName: 'Financeiro Demo', userRole: 'finance_admin' },
  { email: 'artist@useruah.com.br', password: 'artist123', userId: 'usr:artist@useruah.com.br', userName: 'Artista Demo', userRole: 'artist' },
  { email: 'community@useruah.com.br', password: 'community123', userId: 'usr:community@useruah.com.br', userName: 'Community Demo', userRole: 'community_manager' },
  { email: 'curator@useruah.com.br', password: 'curator123', userId: 'usr:curator@useruah.com.br', userName: 'Curadoria Demo', userRole: 'curator' },
  { email: 'affiliate@useruah.com.br', password: 'affiliate123', userId: 'usr:affiliate@useruah.com.br', userName: 'Affiliate Demo', userRole: 'affiliate' },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return new Date().toISOString();
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function readLocalState(): LocalUserState {
  const raw = readStoreFile<Partial<LocalUserState>>('users', { users: {} });
  return { users: raw.users ?? {} };
}

function writeLocalState(value: LocalUserState) {
  writeStoreFile('users', value);
}

function loadFixtureUsers(): FixtureUser[] {
  if (isProductionLikeEnvironment()) return [];

  const raw = process.env.AUTH_LOCAL_USERS_JSON?.trim();
  if (!raw) return DEV_TEST_USERS;

  try {
    const parsed = JSON.parse(raw) as FixtureUser[];
    return parsed.filter(
      (row) =>
        typeof row.email === 'string' &&
        typeof row.password === 'string' &&
        typeof row.userId === 'string' &&
        typeof row.userName === 'string' &&
        isUserRole(row.userRole)
    );
  } catch {
    return [];
  }
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'ER_DUP_ENTRY');
}

function toSession(user: Pick<StoredUser, 'userId' | 'userName' | 'email' | 'userRole'>): AuthSession {
  const roles = getSessionRoleScope(user.userRole);
  return {
    userId: user.userId,
    userName: user.userName,
    userEmail: user.email,
    userRole: user.userRole,
    roles,
    activeRole: user.userRole,
  };
}

function rowToStoredUser(row: MysqlRow): StoredUser {
  return {
    userId: String(row.user_id),
    email: String(row.email).toLowerCase(),
    passwordHash: String(row.password_hash),
    userName: String(row.user_name),
    userRole: row.user_role as UserRole,
    status: row.status as UserStatus,
    createdAt: mysqlDatetimeToIso(row.created_at),
    updatedAt: mysqlDatetimeToIso(row.updated_at),
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${PASSWORD_HASH_PREFIX}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

async function verifyPassword(password: string, encodedHash: string) {
  const [prefix, encodedSalt, encodedKey] = encodedHash.split('$');
  if (prefix !== PASSWORD_HASH_PREFIX || !encodedSalt || !encodedKey) return false;

  try {
    const salt = Buffer.from(encodedSalt, 'base64url');
    const expected = Buffer.from(encodedKey, 'base64url');
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

async function getIdentityPool() {
  if (!shouldUseMysql()) return null;
  return getMysqlPool();
}

export async function registerUser(input: {
  email: string;
  password: string;
  userName: string;
  userRole: UserRole;
}): Promise<{ user: StoredUser; created: boolean }> {
  const email = normalizeEmail(input.email);
  const mysql = await getIdentityPool();
  const existingMysql = mysql
    ? await mysql.execute<MysqlRow[]>(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email])
    : null;
  if (existingMysql?.[0][0]) {
    return { user: rowToStoredUser(existingMysql[0][0]), created: false };
  }

  const state = mysql ? null : readLocalState();
  const localExisting = state?.users[email];
  const fixtureExisting = mysql ? null : loadFixtureUsers().find((row) => normalizeEmail(row.email) === email);
  if (localExisting) return { user: localExisting, created: false };
  if (fixtureExisting) {
    return {
      user: {
        userId: fixtureExisting.userId,
        email,
        passwordHash: '',
        userName: fixtureExisting.userName,
        userRole: fixtureExisting.userRole,
        status: 'active',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      created: false,
    };
  }

  const timestamp = nowIso();
  const user: StoredUser = {
    userId: `usr:${email}`,
    email,
    passwordHash: await hashPassword(input.password),
    userName: input.userName.trim(),
    userRole: input.userRole,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (mysql) {
    try {
      await mysql.execute<MysqlResult>(
        `INSERT INTO users (user_id, email, password_hash, user_name, user_role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.userId, user.email, user.passwordHash, user.userName, user.userRole, user.status, toMysqlDatetime(user.createdAt), toMysqlDatetime(user.updatedAt)]
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
        if (rows[0]) return { user: rowToStoredUser(rows[0]), created: false };
      }
      throw error;
    }
    return { user, created: true };
  }

  state!.users[email] = user;
  writeLocalState(state!);
  return { user, created: true };
}

export async function authenticateUser(emailInput: string, password: string): Promise<AuthSession | null> {
  const email = normalizeEmail(emailInput);
  const mysql = await getIdentityPool();
  if (mysql) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
    const user = rows[0] ? rowToStoredUser(rows[0]) : null;
    if (!user || user.status !== 'active' || !(await verifyPassword(password, user.passwordHash))) return null;
    return toSession(user);
  }

  const localUser = readLocalState().users[email];
  if (localUser && localUser.status === 'active' && (await verifyPassword(password, localUser.passwordHash))) {
    return toSession(localUser);
  }

  const fixture = loadFixtureUsers().find((row) => normalizeEmail(row.email) === email && row.password === password);
  return fixture
    ? toSession({ userId: fixture.userId, userName: fixture.userName, email, userRole: fixture.userRole })
    : null;
}

export async function isEmailRegistered(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const mysql = await getIdentityPool();
  if (mysql) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT user_id FROM users WHERE email = ? LIMIT 1`, [email]);
    return Boolean(rows[0]);
  }
  return Boolean(readLocalState().users[email] || loadFixtureUsers().some((row) => normalizeEmail(row.email) === email));
}
