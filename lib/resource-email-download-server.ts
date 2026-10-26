import "server-only";

import { normalizeLeadEmail } from "@/lib/leads-shared";
import { prisma } from "@/lib/prisma";
import { createResourceDownloadToken } from "@/lib/resource-download-token";
import type { ResourceEmailDownloadGrant } from "@/lib/resource-email-download-token";
import { verifyResourceEmailDownloadToken } from "@/lib/resource-email-download-token";
import { canDownloadFreeResourceLead } from "@/lib/resources-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";

export type ResourceEmailDownloadRedirectResult =
  | { ok: true; redirectPath: string }
  | { ok: false; kind: "invalid" | "refunded" | "not_authorized"; resourceSlug?: string };

async function authorizeGrant(grant: ResourceEmailDownloadGrant): Promise<ResourceEmailDownloadRedirectResult> {
  if (grant.kind === "purchase") {
    const purchase = await prisma.resourcePurchase.findUnique({
      where: { id: grant.purchaseId },
      select: {
        email: true,
        resourceSlug: true,
        refundedAt: true,
      },
    });

    if (!purchase) {
      return { ok: false, kind: "invalid", resourceSlug: undefined };
    }

    if (purchase.refundedAt) {
      return { ok: false, kind: "refunded", resourceSlug: purchase.resourceSlug };
    }

    const resource = getResourceDefinition(purchase.resourceSlug);
    if (!resource || resource.type !== "PAID_DOWNLOAD") {
      return { ok: false, kind: "invalid", resourceSlug: purchase.resourceSlug };
    }

    if (!resource.downloadFileKeys?.includes(grant.fileKey)) {
      return { ok: false, kind: "invalid", resourceSlug: purchase.resourceSlug };
    }

    const shortToken = createResourceDownloadToken({
      email: purchase.email,
      resourceSlug: purchase.resourceSlug,
      fileKey: grant.fileKey,
    });

    return {
      ok: true,
      redirectPath: `/api/resources/download?token=${encodeURIComponent(shortToken)}&download=1`,
    };
  }

  const resource = getResourceDefinition(grant.resourceSlug);
  if (!resource || resource.type !== "FREE_DOWNLOAD") {
    return { ok: false, kind: "invalid", resourceSlug: grant.resourceSlug };
  }

  if (!resource.downloadFileKeys?.includes(grant.fileKey)) {
    return { ok: false, kind: "invalid", resourceSlug: grant.resourceSlug };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: grant.leadId },
    select: {
      email: true,
      resources: {
        where: { resourceSlug: grant.resourceSlug },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!lead?.resources.length) {
    return { ok: false, kind: "not_authorized", resourceSlug: grant.resourceSlug };
  }

  const email = normalizeLeadEmail(lead.email);
  const allowed = await canDownloadFreeResourceLead({
    email,
    resourceSlug: grant.resourceSlug,
    fileKey: grant.fileKey,
  });

  if (!allowed) {
    return { ok: false, kind: "not_authorized", resourceSlug: grant.resourceSlug };
  }

  const shortToken = createResourceDownloadToken({
    email,
    resourceSlug: grant.resourceSlug,
    fileKey: grant.fileKey,
  });

  return {
    ok: true,
    redirectPath: `/api/resources/download?token=${encodeURIComponent(shortToken)}&download=1`,
  };
}

export async function resolveResourceEmailDownloadRedirect(
  token: string,
): Promise<ResourceEmailDownloadRedirectResult> {
  const grant = verifyResourceEmailDownloadToken(token);
  if (!grant) {
    return { ok: false, kind: "invalid" };
  }

  return authorizeGrant(grant);
}
