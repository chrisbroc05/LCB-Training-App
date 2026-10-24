import "server-only";

import {
  type AdminResourceClickRow,
  type AdminResourceStatsRange,
  type AdminResourceStatsRow,
  rangeStartFromChoice,
} from "@/lib/admin-resource-stats-shared";
import {
  getResourceDefinition,
  getResourcesForHub,
  RESOURCE_DEFINITIONS,
  type ResourceDefinition,
} from "@/lib/resources-shared";
import { prisma } from "@/lib/prisma";

export function getAdminResourceStatsSlugs(): ResourceDefinition[] {
  const hub = getResourcesForHub();
  const fixItPlans = RESOURCE_DEFINITIONS.filter(
    (resource) => resource.slug.startsWith("fixit-") || resource.slug === "fix-it-hitting-plans",
  );
  const bySlug = new Map<string, ResourceDefinition>();
  for (const resource of [...hub, ...fixItPlans]) {
    bySlug.set(resource.slug, resource);
  }
  return [...bySlug.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function isFreeDownloadResource(resource: ResourceDefinition) {
  return resource.type === "FREE_DOWNLOAD";
}

function isPaidResource(resource: ResourceDefinition) {
  return resource.type === "PAID_DOWNLOAD";
}

export async function loadAdminResourceStatsTable(
  range: AdminResourceStatsRange,
  now = new Date(),
): Promise<AdminResourceStatsRow[]> {
  const rangeStart = rangeStartFromChoice(range, now);
  const definitions = getAdminResourceStatsSlugs();
  const slugs = definitions.map((resource) => resource.slug);

  const [leadResources, purchases] = await Promise.all([
    prisma.leadResource.findMany({
      where: {
        resourceSlug: { in: slugs },
        ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
      },
      select: {
        resourceSlug: true,
        checkoutStartedAt: true,
        createdAt: true,
        leadId: true,
      },
    }),
    prisma.resourcePurchase.findMany({
      where: {
        resourceSlug: { in: slugs },
        refundedAt: null,
        ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
      },
      select: {
        resourceSlug: true,
        amountCents: true,
        email: true,
      },
    }),
  ]);

  const purchasedEmailsBySlug = new Map<string, Set<string>>();
  for (const purchase of purchases) {
    const set = purchasedEmailsBySlug.get(purchase.resourceSlug) ?? new Set<string>();
    set.add(purchase.email.toLowerCase());
    purchasedEmailsBySlug.set(purchase.resourceSlug, set);
  }

  return definitions.map((definition) => {
    const rows = leadResources.filter((row) => row.resourceSlug === definition.slug);
    const clicks = rows.length;
    const checkoutsStarted = rows.filter((row) => row.checkoutStartedAt).length;
    const slugPurchases = purchases.filter((purchase) => purchase.resourceSlug === definition.slug);
    const purchaseCount = slugPurchases.length;
    const revenueCents = slugPurchases.reduce((sum, row) => sum + (row.amountCents ?? 0), 0);

    let downloads = 0;
    if (isFreeDownloadResource(definition)) {
      downloads = clicks;
    }

    let conversions = 0;
    if (isPaidResource(definition)) {
      conversions = purchaseCount;
    } else if (isFreeDownloadResource(definition)) {
      conversions = downloads;
    } else {
      conversions = purchaseCount;
    }

    const conversionPercent =
      clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : null;

    return {
      slug: definition.slug,
      title: definition.title,
      tag: definition.tag,
      clicks,
      downloads,
      checkoutsStarted,
      purchases: purchaseCount,
      revenueCents,
      conversionPercent,
    };
  });
}

export async function loadAdminResourceClickRows(
  slug: string,
  range: AdminResourceStatsRange,
  now = new Date(),
): Promise<AdminResourceClickRow[]> {
  const definition = getResourceDefinition(slug);
  if (!definition) {
    return [];
  }

  const rangeStart = rangeStartFromChoice(range, now);
  const [leadResources, purchases] = await Promise.all([
    prisma.leadResource.findMany({
      where: {
        resourceSlug: slug,
        ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        lead: { select: { id: true, firstName: true, email: true, role: true } },
      },
    }),
    prisma.resourcePurchase.findMany({
      where: { resourceSlug: slug, refundedAt: null },
      select: { email: true },
    }),
  ]);

  const purchasedEmails = new Set(purchases.map((row) => row.email.toLowerCase()));

  return leadResources.map((row) => {
    const email = row.lead.email.toLowerCase();
    return {
      leadId: row.lead.id,
      name: row.lead.firstName,
      role: row.lead.role,
      clickedAt: row.createdAt.toISOString(),
      purchased: purchasedEmails.has(email),
    };
  });
}
