import { getMembershipBilledPriceDisplay } from "@/lib/membership-billing-shared";
import {
  formatMembershipLevelLabel,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";

export function buildAnnualRenewalReminderEmailText(params: {
  displayName: string;
  level: MembershipLevelKey;
  renewalDateLabel: string;
}): string {
  const levelLabel = formatMembershipLevelLabel(params.level);
  const priceDisplay = getMembershipBilledPriceDisplay({
    level: params.level,
    billingInterval: "ANNUAL",
  });
  return [
    `Hi ${params.displayName},`,
    "",
    `Your ${levelLabel} membership (${priceDisplay}) is set to renew on ${params.renewalDateLabel}.`,
    "If you need to update billing or switch to monthly, open Settings -> My plan.",
    "",
    "Coach Broc",
  ].join("\n");
}

export function shouldRunCommissionMonthlyReportToday(now: Date = new Date()): boolean {
  return now.getUTCDate() === 1;
}

export function buildAnnualRenewalReminderDedupeKey(userId: string, periodEnd: Date): string {
  return `annual-renewal:${userId}:${periodEnd.toISOString().slice(0, 10)}`;
}

export function buildCommissionReportDedupeKey(monthKey: string): string {
  return `commission-report:${monthKey}`;
}
