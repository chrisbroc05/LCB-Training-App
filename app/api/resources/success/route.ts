import { NextResponse } from "next/server";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { buildFixItPlanPath, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { createResourceDownloadToken } from "@/lib/resource-download-token";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { prisma } from "@/lib/prisma";
import {
  getResourceDefinition,
  getResourceDownloadLabel,
} from "@/lib/resources-shared";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  const purchases = await prisma.resourcePurchase.findMany({
    where: { stripeSessionId: sessionId },
    orderBy: { createdAt: "asc" },
  });

  if (!purchases.length) {
    return NextResponse.json({ pending: true, downloads: [] });
  }

  const email = purchases[0]?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Purchase email missing." }, { status: 500 });
  }
  const downloads: { label: string; url: string }[] = [];
  const planPages: { label: string; url: string }[] = [];

  for (const purchase of purchases) {
    const resource = getResourceDefinition(purchase.resourceSlug);
    if (!resource?.downloadFileKeys) {
      continue;
    }
    for (const fileKey of resource.downloadFileKeys) {
      const token = createResourceDownloadToken({
        email,
        resourceSlug: purchase.resourceSlug,
        fileKey,
      });
      downloads.push({
        label: `${resource.title} - ${getResourceDownloadLabel(fileKey)}`,
        url: `/api/resources/download?token=${encodeURIComponent(token)}`,
      });
    }

    if (isFixItResourceSlug(purchase.resourceSlug)) {
      const planToken = createFixItPlanAccessToken({
        email,
        resourceSlug: purchase.resourceSlug,
      });
      planPages.push({
        label: `${resource.title} plan page`,
        url: `${getPublicAppUrl()}${buildFixItPlanPath(purchase.resourceSlug)}?token=${encodeURIComponent(planToken)}`,
      });
    }
  }

  return NextResponse.json({
    pending: false,
    resourceSlug: purchases[0]?.resourceSlug ?? null,
    downloads,
    planPages,
  });
}
