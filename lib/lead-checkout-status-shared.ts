import { getResourceDefinition } from "@/lib/resources-shared";

export function formatLeadResourceCheckoutStatus(params: {
  resourceSlug: string;
  checkoutStartedAt: string | null;
  resourceCreatedAt: string;
  purchasedResourceSlugs: Set<string>;
  now?: Date;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource || resource.type !== "PAID_DOWNLOAD") {
    return null;
  }

  if (params.purchasedResourceSlugs.has(params.resourceSlug)) {
    return "Purchased";
  }

  const now = params.now ?? new Date();
  const createdAt = new Date(params.resourceCreatedAt);
  const hoursSinceClick = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (params.checkoutStartedAt) {
    return "Checkout started";
  }

  if (hoursSinceClick >= 24) {
    return "Checkout started";
  }

  return null;
}
