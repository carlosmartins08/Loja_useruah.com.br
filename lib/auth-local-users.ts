import type { AuthSession, UserRole } from '@/lib/auth-session';

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
];

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
          row.userRole === 'platform_admin' ||
          row.userRole === 'support_agent' ||
          row.userRole === 'production_operator')
    );
  } catch {
    return [];
  }
}

function getLocalUsers() {
  const envUsers = loadUsersFromEnv();
  if (envUsers.length > 0) return envUsers;
  if (process.env.NODE_ENV !== 'production') return DEV_USERS;
  return [];
}

export function authenticateLocalUser(email: string, password: string): AuthSession | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getLocalUsers().find((row) => row.email.toLowerCase() === normalizedEmail && row.password === password);
  if (!user) return null;
  return {
    userId: user.userId,
    userName: user.userName,
    userEmail: user.email.toLowerCase(),
    userRole: user.userRole,
  };
}
