export const COMMISSION_INELIGIBLE_CLUB_PAY = "Club pay organization (no family commission).";

export type CommissionExistingFamilyInput = {
  orgJoinedAt: Date;
  priorPayingMember: boolean;
  priorPurchase: boolean;
  priorLessonWaiverBeforeJoin: boolean;
};

export type CommissionExistingFamilyResult = {
  eligible: boolean;
  reason: string | null;
};

export function evaluateExistingFamilyCommissionEligibility(
  input: CommissionExistingFamilyInput,
): CommissionExistingFamilyResult {
  if (input.priorPayingMember) {
    return {
      eligible: false,
      reason: "Existing family: paying member before joining this org.",
    };
  }
  if (input.priorPurchase) {
    return {
      eligible: false,
      reason: "Existing family: prior purchase before joining this org.",
    };
  }
  if (input.priorLessonWaiverBeforeJoin) {
    return {
      eligible: false,
      reason: "Existing family: lesson waiver signed before joining this org.",
    };
  }
  return { eligible: true, reason: null };
}

export function resolveCommissionEligibleOnOrgJoin(params: {
  orgBillingMode: "FAMILY_PAY" | "CLUB_PAY";
  orgCommissionRate: number;
  existingFamily: CommissionExistingFamilyInput;
}): { commissionEligible: boolean; commissionIneligibleReason: string | null } {
  if (params.orgBillingMode === "CLUB_PAY") {
    return {
      commissionEligible: false,
      commissionIneligibleReason: COMMISSION_INELIGIBLE_CLUB_PAY,
    };
  }
  if (params.orgCommissionRate <= 0) {
    return { commissionEligible: true, commissionIneligibleReason: null };
  }
  const family = evaluateExistingFamilyCommissionEligibility(params.existingFamily);
  return {
    commissionEligible: family.eligible,
    commissionIneligibleReason: family.reason,
  };
}

export function formatCommissionEligibilityLabel(params: {
  eligible: boolean;
  reason: string | null;
  adminOverride: boolean;
}): string {
  if (params.adminOverride) {
    return "Eligible (admin override)";
  }
  if (params.eligible) {
    return "Eligible";
  }
  return params.reason ? `Not eligible (${params.reason})` : "Not eligible";
}
