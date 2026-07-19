import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayoutShell from '@/components/admin/layout/AdminLayoutShell';
import { isAdminRole, resolveHomeByRole } from '@/lib/role-routing/access-routing';
import { normalizeAuthSession } from '@/lib/auth-session';
import { decodeSessionToken } from '@/lib/session-token';
import { isProductionLikeEnvironment } from '@/lib/mysql-runtime';
import { isRbacConfigured } from '@/lib/access-control';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isRbacConfigured()) {
    throw new Error(isProductionLikeEnvironment() ? 'rbac_required_in_public_environment' : 'rbac_required_for_admin_environment');
  }

  const cookieStore = await cookies();
  const session = normalizeAuthSession(decodeSessionToken(cookieStore.get('ruah_session')?.value));

  if (!session) redirect('/login');
  if (!isAdminRole(session.activeRole)) redirect(resolveHomeByRole(session.activeRole));

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
