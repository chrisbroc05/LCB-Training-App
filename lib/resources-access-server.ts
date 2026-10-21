import "server-only";

import { normalizeLeadEmail } from "@/lib/leads-shared";
import { getResourceDefinition } from "@/lib/resources-shared";
import { prisma } from "@/lib/prisma";
import {
  canAccessWorkoutResource,
  getWorkoutResource,
  type WorkoutResourceTier,
} from "@/lib/workout-resources";
import { canAccessWorkoutPrograms, type DatabaseTier } from "@/lib/membership";

export async function emailHasResourcePurchase(email: string, resourceSlug: string) {
  const normalized = normalizeLeadEmail(email);
  const purchase = await prisma.resourcePurchase.findFirst({
    where: { email: normalized, resourceSlug, refundedAt: null },
    select: { id: true },
  });
  return Boolean(purchase);
}

export async function userHasResourcePurchase(userId: string, resourceSlug: string) {
  const purchase = await prisma.resourcePurchase.findFirst({
    where: { userId, resourceSlug, refundedAt: null },
    select: { id: true },
  });
  return Boolean(purchase);
}

export async function canDownloadPaidResourceFile(params: {
  email: string;
  userId?: string | null;
  resourceSlug: string;
  fileKey: string;
  /** When true, only the token email purchase counts (session is ignored). */
  tokenEmailOnly?: boolean;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource || resource.type !== "PAID_DOWNLOAD") {
    return false;
  }
  if (!resource.downloadFileKeys?.includes(params.fileKey)) {
    return false;
  }

  if (!params.tokenEmailOnly && params.userId && (await userHasResourcePurchase(params.userId, params.resourceSlug))) {
    return true;
  }

  return emailHasResourcePurchase(params.email, params.resourceSlug);
}

export async function canDownloadFreeResourceLead(params: {
  email: string;
  resourceSlug: string;
  fileKey: string;
}) {
  const resource = getResourceDefinition(params.resourceSlug);
  if (!resource || resource.type !== "FREE_DOWNLOAD") {
    return false;
  }
  if (!resource.downloadFileKeys?.includes(params.fileKey)) {
    return false;
  }

  const normalized = normalizeLeadEmail(params.email);
  const lead = await prisma.lead.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      resources: {
        where: { resourceSlug: params.resourceSlug },
        select: { id: true },
        take: 1,
      },
    },
  });

  return Boolean(lead?.resources.length);
}

export async function listResourcePurchasesForAccount(params: { userId: string; email: string }) {
  const normalized = normalizeLeadEmail(params.email);
  return prisma.resourcePurchase.findMany({
    where: {
      refundedAt: null,
      OR: [{ userId: params.userId }, { email: normalized }],
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Legacy member guide access via tier (account/downloads). */
export function memberCanAccessLegacyGuideFilename(
  membershipTier: DatabaseTier,
  filename: string,
) {
  const resource = getWorkoutResource(filename);
  if (!resource) {
    return false;
  }
  return canAccessWorkoutResource(membershipTier, resource.requiredTier);
}

export function memberCanAccessWorkoutDownloads(membershipTier: DatabaseTier) {
  return canAccessWorkoutPrograms(membershipTier);
}

export type { WorkoutResourceTier };
