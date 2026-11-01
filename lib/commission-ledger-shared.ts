export const COMMISSION_MIN_PAYOUT_CENTS = 2500;

export type CommissionOrgRateFields = {
  commissionRate: number;
  commissionMonths: number;
  ongoingCommissionRate: number;
  commissionEndsAt: Date | null;
};

export function monthsBetweenCommissionDates(start: Date, end: Date): number {
  const years = end.getUTCFullYear() - start.getUTCFullYear();
  const months = end.getUTCMonth() - start.getUTCMonth();
  return years * 12 + months - (end.getUTCDate() < start.getUTCDate() ? 1 : 0);
}

export function computeCommissionRateForPayment(params: {
  org: CommissionOrgRateFields;
  attributionJoinedAt: Date;
  paidAt: Date;
}): number {
  if (params.org.commissionEndsAt && params.paidAt.getTime() > params.org.commissionEndsAt.getTime()) {
    return 0;
  }
  const monthsElapsed = monthsBetweenCommissionDates(params.attributionJoinedAt, params.paidAt);
  if (monthsElapsed < params.org.commissionMonths) {
    return params.org.commissionRate;
  }
  return params.org.ongoingCommissionRate;
}

/** Commission on net membership revenue (after Stripe processing fee). */
export function computeCommissionCents(netCents: number, rate: number): number {
  if (netCents <= 0 || rate <= 0) {
    return 0;
  }
  return Math.round(Math.abs(netCents) * rate);
}

export function computeRefundCommissionCents(params: {
  originalCommissionCents: number;
  originalAmountPaidCents: number;
  refundAmountPaidCents: number;
}): number {
  const originalPaid = Math.abs(params.originalAmountPaidCents);
  const refundPaid = Math.abs(params.refundAmountPaidCents);
  if (originalPaid <= 0 || refundPaid <= 0) {
    return 0;
  }
  const ratio = Math.min(1, refundPaid / originalPaid);
  return -Math.round(Math.abs(params.originalCommissionCents) * ratio);
}

export function computeRefundNetCents(params: {
  originalNetCents: number;
  originalAmountPaidCents: number;
  refundAmountPaidCents: number;
}): number {
  const originalPaid = Math.abs(params.originalAmountPaidCents);
  const refundPaid = Math.abs(params.refundAmountPaidCents);
  if (originalPaid <= 0 || refundPaid <= 0) {
    return 0;
  }
  const ratio = Math.min(1, refundPaid / originalPaid);
  return -Math.round(Math.abs(params.originalNetCents) * ratio);
}

export function isCommissionQuarterPayoutMonth(monthIndex0: number): boolean {
  return monthIndex0 === 2 || monthIndex0 === 5 || monthIndex0 === 8 || monthIndex0 === 11;
}

export function formatCommissionMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
