import { handleAdminImpactReviewsGet } from '@/lib/admin-api/impact-reviews';

export async function GET(request: Request) {
  return handleAdminImpactReviewsGet(request);
}
