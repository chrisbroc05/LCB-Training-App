import type { CommissionMonthSummary } from "@/lib/commission-payout-shared";
import { formatUsdFromCents } from "@/lib/membership-change-shared";

export type CommissionMonthlyReportLedgerLine = {
  playerLabel: string;
  amountPaidCents: number;
  processingFeeCents: number | null;
  netCents: number | null;
  commissionRate: number;
  commissionCents: number;
  commissionFeePending: boolean;
  isRefund: boolean;
};

export type CommissionMonthlyReportOrgLine = {
  orgName: string;
  monthNetCents: number;
  carriedInCents: number;
  payoutStatus: string;
  amountDueCents: number;
  ledgerLines: CommissionMonthlyReportLedgerLine[];
};

export function formatCommissionReportMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildCommissionMonthlyReportPayoutStatus(
  summary: Pick<
    CommissionMonthSummary,
    | "paid"
    | "amountDueCents"
    | "underMinimum"
    | "carriedForwardCents"
    | "isQuarterEnd"
    | "quarterEndLabel"
  >,
): string {
  if (summary.paid) {
    return "Paid";
  }
  if (summary.amountDueCents > 0) {
    if (summary.isQuarterEnd && summary.quarterEndLabel) {
      return `${formatUsdFromCents(summary.amountDueCents)} due by ${summary.quarterEndLabel}`;
    }
    return `${formatUsdFromCents(summary.amountDueCents)} due now`;
  }
  if (summary.underMinimum && summary.carriedForwardCents > 0) {
    return `Carried forward, under $25 (${formatUsdFromCents(summary.carriedForwardCents)} carried)`;
  }
  return "Nothing due";
}

export function buildCommissionMonthlyReportSubject(params: {
  monthLabel: string;
  totalDueCents: number;
}): string {
  if (params.totalDueCents <= 0) {
    return `Commission report: ${params.monthLabel} - nothing due`;
  }
  return `Commission report: ${params.monthLabel} - ${formatUsdFromCents(params.totalDueCents)} due by the 15th`;
}

export function buildCommissionMonthlyReportEmailText(params: {
  monthKey: string;
  monthLabel: string;
  orgLines: CommissionMonthlyReportOrgLine[];
  commissionsUrl: string;
}): string {
  const lines: string[] = [
    `Commission report for ${params.monthLabel} (${params.monthKey})`,
    "",
    "Per organization:",
    "",
  ];

  if (params.orgLines.length === 0) {
    lines.push("(No commission-configured organizations.)");
  } else {
    for (const org of params.orgLines) {
      lines.push(org.orgName);
      lines.push(`  Net commissions (this month): ${formatUsdFromCents(org.monthNetCents)}`);
      lines.push(`  Carried balance in: ${formatUsdFromCents(org.carriedInCents)}`);
      lines.push(`  Payout status: ${org.payoutStatus}`);
      if (org.ledgerLines.length > 0) {
        lines.push("  Transactions:");
        for (const row of org.ledgerLines) {
          const player = row.playerLabel || "Member";
          if (row.commissionFeePending) {
            lines.push(`    ${player}: fee pending (amount paid ${formatUsdFromCents(Math.abs(row.amountPaidCents))})`);
            continue;
          }
          const feeLabel =
            row.processingFeeCents == null
              ? "-"
              : formatUsdFromCents(row.processingFeeCents);
          const netLabel =
            row.netCents == null ? "-" : formatUsdFromCents(row.netCents);
          const prefix = row.isRefund ? "Refund " : "";
          lines.push(
            `    ${prefix}${player}: paid ${formatUsdFromCents(Math.abs(row.amountPaidCents))}, fee ${feeLabel}, net ${netLabel}, rate ${(row.commissionRate * 100).toFixed(1)}%, commission ${formatUsdFromCents(row.commissionCents)}`,
          );
        }
      }
      lines.push("");
    }
  }

  lines.push(`Review payouts and export CSV: ${params.commissionsUrl}`);
  lines.push("");
  lines.push("Coach Broc");
  return lines.join("\n");
}
