import "server-only";

import { loadQuizAdminDashboard } from "@/lib/player-iq-quiz-admin-server";
import { prisma } from "@/lib/prisma";

export async function loadAdminLeadsPageData() {
  const leadRows = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      resources: {
        select: {
          resourceSlug: true,
          checkoutStartedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const purchaseRows = await prisma.resourcePurchase.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      resourceSlug: true,
      amountCents: true,
      createdAt: true,
      stripeSessionId: true,
    },
  });

  const leads = leadRows.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    resources: lead.resources.map((resource) => ({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      checkoutStartedAt: resource.checkoutStartedAt?.toISOString() ?? null,
    })),
  }));

  const purchases = purchaseRows.map((purchase) => ({
    ...purchase,
    createdAt: purchase.createdAt.toISOString(),
  }));

  const quizDashboard = await loadQuizAdminDashboard();

  return { leads, purchases, quizDashboard };
}
