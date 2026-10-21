import { LEAD_ROLE_OPTIONS } from "@/lib/resources-shared";

export type CoachDailySummarySaleLine = {
  productLabel: string;
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  occurredAt: Date;
};

export type CoachDailySummaryNewLeadLine = {
  name: string;
  email: string;
  roleLabel: string;
  firstResourceLabel: string;
};

export type CoachDailySummaryCheckoutFollowUpLine = {
  name: string;
  email: string;
  itemLabel: string;
};

export type CoachDailySummaryFreeAccountLine = {
  name: string;
  accountKindLabel: string;
  email: string;
};

export type CoachDailySummaryBusiness = {
  sales: CoachDailySummarySaleLine[];
  salesTotalCents: number;
  newLeads: CoachDailySummaryNewLeadLine[];
  checkoutFollowUps: CoachDailySummaryCheckoutFollowUpLine[];
  freeAccounts: CoachDailySummaryFreeAccountLine[];
};

export const PLAYBOOK_SALE_AMOUNT_CENTS = 5900;
export const TWELVE_WEEK_SALE_AMOUNT_CENTS = 59900;

const CHICAGO_TIME_ZONE = "America/Chicago";

export function formatCoachSummarySaleAmount(amountCents: number) {
  const dollars = amountCents / 100;
  if (Number.isInteger(dollars)) {
    return `$${dollars}`;
  }
  return `$${dollars.toFixed(2)}`;
}

export function formatCoachSummaryChicagoTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function leadRoleLabel(role: string) {
  const match = LEAD_ROLE_OPTIONS.find((option) => option.value === role);
  return match?.label ?? role;
}

export function coachDailySummaryBusinessHasContent(business: CoachDailySummaryBusiness | null | undefined) {
  if (!business) {
    return false;
  }

  return (
    business.sales.length > 0 ||
    business.newLeads.length > 0 ||
    business.checkoutFollowUps.length > 0 ||
    business.freeAccounts.length > 0
  );
}

export function buildCoachDailySummarySubject(params: {
  finished: number;
  active: number;
  notFinishedCount: number;
  business: CoachDailySummaryBusiness | null | undefined;
}) {
  const newLeadsCount = params.business?.newLeads.length ?? 0;
  const salesCount = params.business?.sales.length ?? 0;

  if (newLeadsCount === 0 && salesCount === 0) {
    return `Program today: ${params.finished} of ${params.active} finished`;
  }

  const segments: string[] = [];

  if (newLeadsCount > 0) {
    segments.push(`${newLeadsCount} new lead${newLeadsCount === 1 ? "" : "s"}`);
  }

  if (salesCount > 0) {
    const total = params.business?.salesTotalCents ?? 0;
    segments.push(
      salesCount === 1
        ? `1 sale (${formatCoachSummarySaleAmount(total)})`
        : `${salesCount} sales (${formatCoachSummarySaleAmount(total)})`,
    );
  }

  let subject = `LCB Today: ${segments.join(", ")}`;

  if (params.notFinishedCount > 0) {
    subject += ` | ${params.notFinishedCount} player${params.notFinishedCount === 1 ? "" : "s"} not finished`;
  }

  return subject;
}
