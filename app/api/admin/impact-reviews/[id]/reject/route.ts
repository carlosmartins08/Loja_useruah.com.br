import { handleAdminImpactReviewRejectPost } from '@/lib/admin-api/impact-reviews';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleAdminImpactReviewRejectPost(request, context);
}
