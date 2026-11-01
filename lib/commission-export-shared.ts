export type CommissionCsvLedgerRow = {
  paidAt: string;
  playerFirstName: string | null;
  playerLastName: string | null;
  level: string | null;
  billingInterval: string | null;
  amountPaidCents: number;
  processingFeeCents: number | null;
  netCents: number | null;
  commissionRate: number;
  commissionCents: number;
  commissionFeePending: boolean;
  isRefund: boolean;
};

export function formatCommissionPlayerName(row: CommissionCsvLedgerRow): string {
  const first = row.playerFirstName?.trim() || "";
  const last = row.playerLastName?.trim() || "";
  if (!first && !last) {
    return "";
  }
  const initial = last ? `${last.charAt(0).toUpperCase()}.` : "";
  return [first, initial].filter(Boolean).join(" ");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function buildCommissionCsv(params: {
  orgName: string;
  monthKey: string;
  rows: CommissionCsvLedgerRow[];
  monthCommissionCents: number;
  refundCommissionCents: number;
  carriedBalanceCents: number;
}): string {
  const header = [
    "org",
    "month",
    "player",
    "level",
    "interval",
    "payment_date",
    "amount_paid_cents",
    "processing_fee_cents",
    "net_cents",
    "rate",
    "commission_cents",
    "fee_pending",
    "is_refund",
  ];
  const lines = [header.join(",")];

  for (const row of params.rows) {
    lines.push(
      [
        csvEscape(params.orgName),
        params.monthKey,
        csvEscape(formatCommissionPlayerName(row)),
        row.level ?? "",
        row.billingInterval ?? "",
        row.paidAt.slice(0, 10),
        String(row.amountPaidCents),
        row.processingFeeCents == null ? "" : String(row.processingFeeCents),
        row.netCents == null ? "" : String(row.netCents),
        String(row.commissionRate),
        String(row.commissionCents),
        row.commissionFeePending ? "yes" : "no",
        row.isRefund ? "yes" : "no",
      ].join(","),
    );
  }

  lines.push("");
  lines.push(`month_commission_total_cents,${params.monthCommissionCents}`);
  lines.push(`refund_commission_total_cents,${params.refundCommissionCents}`);
  lines.push(`carried_balance_cents,${params.carriedBalanceCents}`);
  return lines.join("\n");
}
