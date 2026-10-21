import "server-only";

import {
  PLAYBOOK_SALE_AMOUNT_CENTS,
  TWELVE_WEEK_SALE_AMOUNT_CENTS,
  type CoachDailySummaryBusiness,
  type CoachDailySummaryCheckoutFollowUpLine,
  type CoachDailySummaryFreeAccountLine,
  type CoachDailySummaryNewLeadLine,
  type CoachDailySummarySaleLine,
  leadRoleLabel,
} from "@/lib/coach-daily-summary-business-shared";
import { getChicagoDayEnd, getChicagoDayStart } from "@/lib/program-email-chicago";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";
import { prisma } from "@/lib/prisma";
import { getResourceDefinition } from "@/lib/resources-shared";
import { TWELVE_WEEK_PROGRAM_NAME } from "@/lib/twelve-week-program";
import { getPlayerFirstName } from "@/lib/account-shared";

function resourceProductLabel(resourceSlug: string) {
  return getResourceDefinition(resourceSlug)?.title ?? resourceSlug;
}

function buyerDisplayName(params: {
  name: string | null | undefined;
  playerFirstName: string | null | undefined;
  accountHolderName: string | null | undefined;
  email: string;
}) {
  const fromProfile =
    params.name?.trim() ||
    params.playerFirstName?.trim() ||
    params.accountHolderName?.trim() ||
    "";
  return fromProfile || params.email;
}

function parsePriceDisplayToCents(priceDisplay: string | undefined) {
  if (!priceDisplay) {
    return null;
  }
  const match = priceDisplay.match(/\$(\d+)/);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10) * 100;
}

export async function buildCoachDailySummaryBusinessData(
  dateKey: string,
): Promise<CoachDailySummaryBusiness> {
  const dayStart = getChicagoDayStart(dateKey);
  const dayEnd = getChicagoDayEnd(dateKey);

  const sales: CoachDailySummarySaleLine[] = [];

  const basicStripePriceIds = [
    process.env.STRIPE_BASIC_PRICE_ID,
    process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
  ].filter((value): value is string => Boolean(value));

  const [resourcePurchases, remotePurchases, twelveWeekBuyers, playbookBuyers] = await Promise.all([
    prisma.resourcePurchase.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        email: { not: "" },
      },
      include: {
        user: {
          select: {
            name: true,
            playerFirstName: true,
            accountHolderName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.remoteSessionPurchase.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        email: { not: "" },
      },
      include: {
        user: {
          select: {
            name: true,
            playerFirstName: true,
            accountHolderName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        isTestAccount: false,
        twelveWeekProgramStartedAt: { gte: dayStart, lt: dayEnd },
      },
      select: {
        name: true,
        email: true,
        playerFirstName: true,
        accountHolderName: true,
        twelveWeekProgramStartedAt: true,
      },
      orderBy: { twelveWeekProgramStartedAt: "asc" },
    }),
    basicStripePriceIds.length > 0
      ? prisma.user.findMany({
          where: {
            isTestAccount: false,
            membershipTier: "BASIC",
            updatedAt: { gte: dayStart, lt: dayEnd },
            stripePriceId: { in: basicStripePriceIds },
          },
          select: {
            name: true,
            email: true,
            playerFirstName: true,
            accountHolderName: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  for (const purchase of resourcePurchases) {
    const resource = getResourceDefinition(purchase.resourceSlug);
    const amountCents =
      purchase.amountCents ??
      parsePriceDisplayToCents(resource?.priceDisplay) ??
      0;
    sales.push({
      productLabel: resourceProductLabel(purchase.resourceSlug),
      amountCents,
      buyerName: buyerDisplayName({
        name: purchase.user?.name,
        playerFirstName: purchase.user?.playerFirstName,
        accountHolderName: purchase.user?.accountHolderName,
        email: purchase.email,
      }),
      buyerEmail: purchase.email,
      occurredAt: purchase.createdAt,
    });
  }

  for (const purchase of remotePurchases) {
    sales.push({
      productLabel: resourceProductLabel("remote-session"),
      amountCents: purchase.amountCents ?? 6000,
      buyerName: buyerDisplayName({
        name: purchase.user?.name,
        playerFirstName: purchase.user?.playerFirstName,
        accountHolderName: purchase.user?.accountHolderName,
        email: purchase.email,
      }),
      buyerEmail: purchase.email,
      occurredAt: purchase.createdAt,
    });
  }

  for (const user of twelveWeekBuyers) {
    if (!user.twelveWeekProgramStartedAt) {
      continue;
    }
    sales.push({
      productLabel: TWELVE_WEEK_PROGRAM_NAME,
      amountCents: TWELVE_WEEK_SALE_AMOUNT_CENTS,
      buyerName: buyerDisplayName({
        name: user.name,
        playerFirstName: user.playerFirstName,
        accountHolderName: user.accountHolderName,
        email: user.email,
      }),
      buyerEmail: user.email,
      occurredAt: user.twelveWeekProgramStartedAt,
    });
  }

  for (const user of playbookBuyers) {
    sales.push({
      productLabel: PLAYBOOK_NAME,
      amountCents: PLAYBOOK_SALE_AMOUNT_CENTS,
      buyerName: buyerDisplayName({
        name: user.name,
        playerFirstName: user.playerFirstName,
        accountHolderName: user.accountHolderName,
        email: user.email,
      }),
      buyerEmail: user.email,
      occurredAt: user.updatedAt,
    });
  }

  sales.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const salesTotalCents = sales.reduce((sum, line) => sum + line.amountCents, 0);

  const newLeadRows = await prisma.lead.findMany({
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      source: "resources",
    },
    select: {
      firstName: true,
      email: true,
      role: true,
      firstResourceSlug: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const newLeads: CoachDailySummaryNewLeadLine[] = newLeadRows.map((lead) => ({
    name: lead.firstName,
    email: lead.email,
    roleLabel: leadRoleLabel(lead.role),
    firstResourceLabel: lead.firstResourceSlug
      ? resourceProductLabel(lead.firstResourceSlug)
      : "Resources",
  }));

  const checkoutRows = await prisma.leadResource.findMany({
    where: {
      checkoutStartedAt: { gte: dayStart, lt: dayEnd },
    },
    include: {
      lead: {
        select: {
          firstName: true,
          email: true,
        },
      },
    },
    orderBy: { checkoutStartedAt: "asc" },
  });

  const checkoutEmails = [...new Set(checkoutRows.map((row) => row.lead.email))];
  const purchasedPairs = new Set<string>();
  if (checkoutEmails.length > 0) {
    const purchasesForLeads = await prisma.resourcePurchase.findMany({
      where: { email: { in: checkoutEmails } },
      select: { email: true, resourceSlug: true },
    });
    for (const purchase of purchasesForLeads) {
      purchasedPairs.add(`${purchase.email}:${purchase.resourceSlug}`);
    }
  }

  const checkoutFollowUps: CoachDailySummaryCheckoutFollowUpLine[] = [];
  for (const row of checkoutRows) {
    const resource = getResourceDefinition(row.resourceSlug);
    if (resource?.type !== "PAID_DOWNLOAD") {
      continue;
    }
    if (purchasedPairs.has(`${row.lead.email}:${row.resourceSlug}`)) {
      continue;
    }
    checkoutFollowUps.push({
      name: row.lead.firstName,
      email: row.lead.email,
      itemLabel: resourceProductLabel(row.resourceSlug),
    });
  }

  const freeAccountRows = await prisma.user.findMany({
    where: {
      isTestAccount: false,
      membershipTier: "FREE",
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: {
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      accountHolderName: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const freeAccounts: CoachDailySummaryFreeAccountLine[] = freeAccountRows.map((user) => ({
    name:
      getPlayerFirstName(user) ||
      user.accountHolderName?.trim() ||
      user.name?.trim() ||
      user.email,
    accountKindLabel: user.accountRole === "PARENT" ? "Parent" : "Player",
    email: user.email,
  }));

  return {
    sales,
    salesTotalCents,
    newLeads,
    checkoutFollowUps,
    freeAccounts,
  };
}

export async function loadCoachDailySummaryBusinessSafe(dateKey: string) {
  try {
    return await buildCoachDailySummaryBusinessData(dateKey);
  } catch (error) {
    console.error("Coach daily summary business section failed", error);
    return null;
  }
}
