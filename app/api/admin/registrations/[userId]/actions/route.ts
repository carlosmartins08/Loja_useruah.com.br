import { handleAdminRegistrationActionsPatch } from '@/lib/admin-api/registration-actions';

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  return handleAdminRegistrationActionsPatch(request, context);
}
