import "server-only";

import {
  classifyPaidResourceDownload,
  type ResourceDownloadGateKind,
} from "@/lib/resource-download-access-shared";
import { peekResourceDownloadToken, verifyResourceDownloadToken } from "@/lib/resource-download-token";
import type { ResourceDownloadTokenPayload } from "@/lib/resource-download-token-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { prisma } from "@/lib/prisma";
import { canDownloadFreeResourceLead } from "@/lib/resources-access-server";
import { getResourceDefinition } from "@/lib/resources-shared";

export type ResourcePurchaseLookup = {
  purchaseActive: boolean;
  purchaseRefunded: boolean;
};

export async function lookupResourcePurchaseForEmail(
  email: string,
  resourceSlug: string,
): Promise<ResourcePurchaseLookup> {
  const normalized = normalizeLeadEmail(email);
  const purchase = await prisma.resourcePurchase.findFirst({
    where: { email: normalized, resourceSlug },
    orderBy: { createdAt: "desc" },
    select: { refundedAt: true },
  });
  if (!purchase) {
    return { purchaseActive: false, purchaseRefunded: false };
  }
  if (purchase.refundedAt) {
    return { purchaseActive: false, purchaseRefunded: true };
  }
  return { purchaseActive: true, purchaseRefunded: false };
}

export async function resolvePaidResourceDownloadGate(
  token: string,
): Promise<
  | { kind: "allow"; payload: ResourceDownloadTokenPayload }
  | { kind: Exclude<ResourceDownloadGateKind, "allow">; resourceSlug?: string }
> {
  const payload = verifyResourceDownloadToken(token);
  const peek = payload ?? peekResourceDownloadToken(token);
  const resourceSlug = peek?.resourceSlug;

  if (!payload) {
    if (peek && resourceSlug) {
      const lookup = await lookupResourcePurchaseForEmail(peek.email, resourceSlug);
      if (lookup.purchaseRefunded) {
        return { kind: "refunded", resourceSlug };
      }
    }
    return { kind: "invalid", resourceSlug };
  }

  const lookup = await lookupResourcePurchaseForEmail(payload.email, payload.resourceSlug);
  const kind = classifyPaidResourceDownload({
    payload,
    tokenAccepted: true,
    purchaseRefunded: lookup.purchaseRefunded,
    purchaseActive: lookup.purchaseActive,
  });

  if (kind === "allow") {
    return { kind: "allow", payload };
  }
  return { kind, resourceSlug: payload.resourceSlug };
}

export async function resolveFreeResourceDownloadGate(token: string) {
  const payload = verifyResourceDownloadToken(token);
  if (!payload) {
    const peek = peekResourceDownloadToken(token);
    return { kind: "invalid" as const, resourceSlug: peek?.resourceSlug };
  }

  const resource = getResourceDefinition(payload.resourceSlug);
  if (!resource || resource.type !== "FREE_DOWNLOAD") {
    return { kind: "invalid" as const, resourceSlug: payload.resourceSlug };
  }

  const allowed = await canDownloadFreeResourceLead({
    email: payload.email,
    resourceSlug: payload.resourceSlug,
    fileKey: payload.fileKey,
  });

  if (!allowed) {
    return { kind: "not_authorized" as const, resourceSlug: payload.resourceSlug };
  }

  return { kind: "allow" as const, payload };
}
