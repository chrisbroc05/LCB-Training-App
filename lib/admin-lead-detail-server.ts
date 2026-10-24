import "server-only";

import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { getResourceDefinition } from "@/lib/resources-shared";
import { prisma } from "@/lib/prisma";

export async function loadAdminLeadDetail(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      resources: { orderBy: { createdAt: "desc" } },
      quizAttempts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) {
    return null;
  }

  const purchases = await prisma.resourcePurchase.findMany({
    where: { email: lead.email.toLowerCase(), refundedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const member =
    lead.userId != null
      ? await prisma.user.findUnique({
          where: { id: lead.userId },
          select: { id: true, name: true, email: true },
        })
      : await prisma.user.findFirst({
          where: { email: { equals: lead.email, mode: "insensitive" } },
          select: { id: true, name: true, email: true },
        });

  return {
    id: lead.id,
    firstName: lead.firstName,
    email: lead.email,
    role: lead.role,
    source: lead.source,
    isBuyer: lead.isBuyer,
    unsubscribedAt: lead.unsubscribedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    member: member
      ? {
          id: member.id,
          name: member.name,
          email: member.email,
          href: ADMIN_ROUTES.players.members,
        }
      : null,
    resources: lead.resources.map((resource) => ({
      id: resource.id,
      slug: resource.resourceSlug,
      title: getResourceDefinition(resource.resourceSlug)?.title ?? resource.resourceSlug,
      clickedAt: resource.createdAt.toISOString(),
      checkoutStartedAt: resource.checkoutStartedAt?.toISOString() ?? null,
    })),
    quizAttempts: lead.quizAttempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      level: attempt.level,
      completedAt: attempt.completedAt?.toISOString() ?? null,
      href: attempt.completedAt ? ADMIN_ROUTES.content.quizAttempt(attempt.id) : null,
    })),
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      slug: purchase.resourceSlug,
      title: getResourceDefinition(purchase.resourceSlug)?.title ?? purchase.resourceSlug,
      amountCents: purchase.amountCents,
      createdAt: purchase.createdAt.toISOString(),
    })),
  };
}
