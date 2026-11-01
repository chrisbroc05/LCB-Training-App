import { COMMISSION_MIN_PAYOUT_CENTS, formatCommissionMonthKey } from "@/lib/commission-ledger-shared";

export type CommissionLedgerMonthRow = {
  commissionCents: number;
  paidAt: Date | string;
  commissionFeePending?: boolean;
};

export type CommissionMonthPayoutRecord = {
  monthKey: string;
  paid: boolean;
  amountCents?: number;
  paidAt?: string | null;
  method?: string | null;
  note?: string | null;
};

export type CommissionMonthSummary = {
  monthKey: string;
  monthCommissionCents: number;
  carriedInCents: number;
  combinedCents: number;
  underMinimum: boolean;
  amountDueCents: number;
  carriedForwardCents: number;
  isQuarterEnd: boolean;
  quarterEndLabel: string | null;
  paid: boolean;
  payoutAmountCents: number | null;
  payoutPaidAt: string | null;
  payoutMethod: string | null;
  payoutNote: string | null;
};

export function isCommissionQuarterEndMonth(monthKey: string): boolean {
  const month = Number(monthKey.split("-")[1]);
  return month === 3 || month === 6 || month === 9 || month === 12;
}

export function commissionQuarterEndLabel(monthKey: string): string | null {
  if (!isCommissionQuarterEndMonth(monthKey)) {
    return null;
  }
  const [year, month] = monthKey.split("-").map(Number);
  const endMonth = month;
  const endDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  const monthName = new Date(Date.UTC(year, endMonth - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `${monthName} ${endDay}, ${year}`;
}

export function sumCommissionCentsInMonth(
  entries: CommissionLedgerMonthRow[],
  monthKey: string,
): number {
  return entries.reduce((sum, entry) => {
    const key = formatCommissionMonthKey(new Date(entry.paidAt));
    if (key !== monthKey) {
      return sum;
    }
    if (entry.commissionFeePending) {
      return sum;
    }
    return sum + entry.commissionCents;
  }, 0);
}

export function buildCommissionMonthSummaries(params: {
  monthKeys: string[];
  entries: CommissionLedgerMonthRow[];
  payouts: CommissionMonthPayoutRecord[];
}): CommissionMonthSummary[] {
  let carriedBalanceCents = 0;
  const payoutByMonth = new Map(params.payouts.map((p) => [p.monthKey, p]));

  return params.monthKeys.map((monthKey) => {
    const monthCommissionCents = sumCommissionCentsInMonth(params.entries, monthKey);
    const carriedInCents = carriedBalanceCents;
    const combinedCents = monthCommissionCents + carriedInCents;
    const quarterEnd = isCommissionQuarterEndMonth(monthKey);
    const meetsMinimum = combinedCents >= COMMISSION_MIN_PAYOUT_CENTS;
    const amountDueCents = meetsMinimum || quarterEnd ? combinedCents : 0;
    const carriedForwardCents = amountDueCents === 0 ? combinedCents : 0;

    const payout = payoutByMonth.get(monthKey);
    const paid = Boolean(payout?.paid);
    carriedBalanceCents = paid ? 0 : carriedForwardCents;

    return {
      monthKey,
      monthCommissionCents,
      carriedInCents,
      combinedCents,
      underMinimum: combinedCents > 0 && combinedCents < COMMISSION_MIN_PAYOUT_CENTS,
      amountDueCents,
      carriedForwardCents,
      isQuarterEnd: quarterEnd,
      quarterEndLabel: commissionQuarterEndLabel(monthKey),
      paid,
      payoutAmountCents: payout?.amountCents ?? null,
      payoutPaidAt: payout?.paidAt ?? null,
      payoutMethod: payout?.method ?? null,
      payoutNote: payout?.note ?? null,
    };
  });
}

export function listCommissionMonthKeysThrough(
  entries: CommissionLedgerMonthRow[],
  through: Date = new Date(),
): string[] {
  const keys = new Set<string>();
  for (const entry of entries) {
    keys.add(formatCommissionMonthKey(new Date(entry.paidAt)));
  }
  if (keys.size === 0) {
    return [formatCommissionMonthKey(through)];
  }
  const sorted = [...keys].sort();
  const start = sorted[0]!;
  const end = formatCommissionMonthKey(through);
  const result: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [endY, endM] = end.split("-").map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}
