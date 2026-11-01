import type { CommissionMonthSummary } from "@/lib/commission-payout-shared";

export const COMMISSION_PAYOUT_METHODS = ["check", "ACH", "Zelle"] as const;
export type CommissionPayoutMethod = (typeof COMMISSION_PAYOUT_METHODS)[number];

export function isCommissionPayoutMethod(value: string): value is CommissionPayoutMethod {
  return (COMMISSION_PAYOUT_METHODS as readonly string[]).includes(value);
}

export type AdminCommissionFamilyRow = {
  userId: string;
  email: string;
  playerName: string;
  commissionEligible: boolean;
  commissionIneligibleReason: string | null;
  commissionEligibleAdminOverride: boolean;
  commissionOverrideNote: string | null;
  eligibilityLabel: string;
};

export type AdminCommissionOrgDetail = {
  org: {
    id: string;
    name: string;
    commissionRate: number;
    commissionMonths: number;
    ongoingCommissionRate: number;
    commissionEndsAt: string | null;
    billingMode: "FAMILY_PAY" | "CLUB_PAY";
  };
  monthSummaries: CommissionMonthSummary[];
  families: AdminCommissionFamilyRow[];
  ledger: Array<{
    id: string;
    paidAt: string;
    amountPaidCents: number;
    processingFeeCents: number | null;
    netCents: number | null;
    paymentCents: number;
    commissionCents: number;
    commissionRate: number;
    commissionFeePending: boolean;
    isRefund: boolean;
    level: string | null;
    billingInterval: string | null;
    memberEmail: string;
    memberName: string;
    playerFirstName: string | null;
    playerLastName: string | null;
  }>;
};
