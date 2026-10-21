import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { getFixItPlanByResourceSlug, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { lookupResourcePurchaseForEmail } from "@/lib/resource-download-access-server";
import { classifyPaidResourceDownload } from "@/lib/resource-download-access-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { prisma } from "@/lib/prisma";

export async function emailHasActiveResourcePurchase(email: string, resourceSlug: string) {
  const normalized = normalizeLeadEmail(email);
  const purchase = await prisma.resourcePurchase.findFirst({
    where: {
      email: normalized,
      resourceSlug,
      refundedAt: null,
    },
    select: { id: true },
  });
  return Boolean(purchase);
}

export async function userHasActiveResourcePurchase(userId: string, resourceSlug: string) {
  const purchase = await prisma.resourcePurchase.findFirst({
    where: {
      userId,
      resourceSlug,
      refundedAt: null,
    },
    select: { id: true },
  });
  return Boolean(purchase);
}

export async function resolveFixItPlanAccessEmail(params: {
  resourceSlug: string;
  token?: string | null;
  sessionEmail?: string | null;
  sessionUserId?: string | null;
}) {
  if (!isFixItResourceSlug(params.resourceSlug) || !getFixItPlanByResourceSlug(params.resourceSlug)) {
    return null;
  }

  const token = params.token?.trim();
  if (token) {
    const payload = verifyFixItPlanAccessToken(token);
    if (!payload || payload.resourceSlug !== params.resourceSlug) {
      return null;
    }
    const allowed = await emailHasActiveResourcePurchase(payload.email, params.resourceSlug);
    return allowed ? payload.email : null;
  }

  const sessionEmail = params.sessionEmail?.trim().toLowerCase();
  if (sessionEmail) {
    if (await emailHasActiveResourcePurchase(sessionEmail, params.resourceSlug)) {
      return sessionEmail;
    }
  }

  const sessionUserId = params.sessionUserId?.trim();
  if (sessionUserId) {
    if (await userHasActiveResourcePurchase(sessionUserId, params.resourceSlug)) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { email: true },
      });
      return user?.email?.toLowerCase() ?? null;
    }
  }

  return null;
}

export async function assertFixItPlanAccessFromRequest(params: {
  resourceSlug: string;
  token?: string | null;
}) {
  const session = await getServerSession(authOptions);
  return resolveFixItPlanAccessEmail({
    resourceSlug: params.resourceSlug,
    token: params.token,
    sessionEmail: session?.user?.email ?? null,
    sessionUserId: session?.user?.id ?? null,
  });
}

export type FixItPdfDownloadGate =
  | { kind: "allow" }
  | { kind: "invalid" | "refunded" | "not_authorized" };

export async function resolveFixItPdfDownloadGate(params: {
  resourceSlug: string;
  token?: string | null;
}): Promise<FixItPdfDownloadGate> {
  const session = await getServerSession(authOptions);
  const token = params.token?.trim();

  if (token) {
    const payload = verifyFixItPlanAccessToken(token);
    if (!payload || payload.resourceSlug !== params.resourceSlug) {
      return { kind: "invalid" };
    }
    const lookup = await lookupResourcePurchaseForEmail(payload.email, params.resourceSlug);
    const classified = classifyPaidResourceDownload({
      payload: {
        email: payload.email,
        resourceSlug: payload.resourceSlug,
        fileKey: "",
        exp: 0,
      },
      tokenAccepted: true,
      purchaseRefunded: lookup.purchaseRefunded,
      purchaseActive: lookup.purchaseActive,
    });
    if (classified === "allow") {
      return { kind: "allow" };
    }
    return { kind: classified === "refunded" ? "refunded" : "not_authorized" };
  }

  const sessionEmail = await resolveFixItPlanAccessEmail({
    resourceSlug: params.resourceSlug,
    token: null,
    sessionEmail: session?.user?.email ?? null,
    sessionUserId: session?.user?.id ?? null,
  });
  if (sessionEmail) {
    return { kind: "allow" };
  }

  return { kind: "invalid" };
}
