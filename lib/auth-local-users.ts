import { ALL_USER_ROLES, type AuthSession, type UserRole } from '@/lib/auth-session';

interface LocalAuthUser {
  email: string;
  password: string;
  userId: string;
  userName: string;
  userRole: UserRole;
}

const DEV_USERS: LocalAuthUser[] = [
  {
    email: 'customer@useruah.com.br',
    password: 'customer123',
    userId: 'usr:customer@useruah.com.br',
    userName: 'Cliente Demo',
    userRole: 'customer',
  },
  {
    email: 'supplier@useruah.com.br',
    password: 'supplier123',
    userId: 'usr:supplier@useruah.com.br',
    userName: 'Fornecedor Demo',
    userRole: 'supplier',
  },
  {
    email: 'admin@useruah.com.br',
    password: 'admin123',
    userId: 'usr:admin@useruah.com.br',
    userName: 'Admin Demo',
    userRole: 'platform_admin',
  },
  {
    email: 'support@useruah.com.br',
    password: 'support123',
    userId: 'usr:support@useruah.com.br',
    userName: 'Suporte Demo',
    userRole: 'support_agent',
  },
  {
    email: 'production@useruah.com.br',
    password: 'production123',
    userId: 'usr:production@useruah.com.br',
    userName: 'Producao Demo',
    userRole: 'production_operator',
  },
  {
    email: 'finance@useruah.com.br',
    password: 'finance123',
    userId: 'usr:finance@useruah.com.br',
    userName: 'Financeiro Demo',
    userRole: 'finance_admin',
  },
  {
    email: 'artist@useruah.com.br',
    password: 'artist123',
    userId: 'usr:artist@useruah.com.br',
    userName: 'Artista Demo',
    userRole: 'artist',
  },
  {
    email: 'community@useruah.com.br',
    password: 'community123',
    userId: 'usr:community@useruah.com.br',
    userName: 'Community Demo',
    userRole: 'community_manager',
  },
  {
    email: 'curator@useruah.com.br',
    password: 'curator123',
    userId: 'usr:curator@useruah.com.br',
    userName: 'Curadoria Demo',
    userRole: 'curator',
  },
  {
    email: 'affiliate@useruah.com.br',
    password: 'affiliate123',
    userId: 'usr:affiliate@useruah.com.br',
    userName: 'Affiliate Demo',
    userRole: 'affiliate',
  },
];
const runtimeUsers = new Map<string, LocalAuthUser>();

function loadUsersFromEnv(): LocalAuthUser[] {
  const raw = process.env.AUTH_LOCAL_USERS_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalAuthUser[];
    return parsed.filter(
      (row) =>
        typeof row.email === 'string' &&
        typeof row.password === 'string' &&
        typeof row.userId === 'string' &&
        typeof row.userName === 'string' &&
        (row.userRole === 'customer' ||
          row.userRole === 'supplier' ||
          row.userRole === 'platform_admin' ||
          row.userRole === 'support_agent' ||
          row.userRole === 'production_operator' ||
          row.userRole === 'finance_admin' ||
          row.userRole === 'artist' ||
          row.userRole === 'community_manager' ||
          row.userRole === 'curator' ||
          row.userRole === 'affiliate')
    );
  } catch {
    return [];
  }
}

function getLocalUsers() {
  const envUsers = loadUsersFromEnv();
  const baseUsers = envUsers.length > 0 ? envUsers : process.env.NODE_ENV !== 'production' ? DEV_USERS : [];
  return [...baseUsers, ...Array.from(runtimeUsers.values())];
}

export function registerLocalUser(input: {
  email: string;
  password: string;
  userName: string;
  userRole: UserRole;
}): { user: LocalAuthUser; created: boolean } {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = getLocalUsers().find((row) => row.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { user: existing, created: false };
  }

  const userId = `usr:${normalizedEmail}`;
  const next: LocalAuthUser = {
    email: normalizedEmail,
    password: input.password,
    userId,
    userName: input.userName.trim(),
    userRole: input.userRole,
  };
  runtimeUsers.set(normalizedEmail, next);
  return { user: next, created: true };
}

export function isEmailRegistered(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return getLocalUsers().some((row) => row.email.toLowerCase() === normalizedEmail);
}

export function authenticateLocalUser(email: string, password: string): AuthSession | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getLocalUsers().find((row) => row.email.toLowerCase() === normalizedEmail && row.password === password);
  if (!user) return null;
  const roles = user.userRole === 'platform_admin' ? ALL_USER_ROLES : [user.userRole];
  return {
    userId: user.userId,
    userName: user.userName,
    userEmail: user.email.toLowerCase(),
    userRole: user.userRole,
    roles,
    activeRole: user.userRole,
  };
}
