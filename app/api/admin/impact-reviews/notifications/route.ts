import { handleAdminImpactReviewNotificationsGet } from '@/lib/admin-api/impact-reviews';

export async function GET(request: Request) {
  return handleAdminImpactReviewNotificationsGet(request);
}
