/**
 * Stripe membership subscription lifecycle (client-safe): cancel_at / cancel_at_period_end expectations.
 */

export const MEMBERSHIP_SUBSCRIPTION_BILLING_MODE = { type: "classic" as const };

export type MembershipPlanLifecycleAction =
  | "signup"
  | "upgrade"
  | "schedule_downgrade"
  | "keep_current_level"
  | "cancel_membership"
  | "resume_membership";

export type MembershipStripeCancelExpectation = {
  allowCancelAtTimestamp: boolean;
  allowCancelAtPeriodEnd: boolean;
};

export function expectedCancelStateAfterPlanAction(
  action: MembershipPlanLifecycleAction,
): MembershipStripeCancelExpectation {
  if (action === "cancel_membership") {
    return { allowCancelAtTimestamp: true, allowCancelAtPeriodEnd: true };
  }
  return { allowCancelAtTimestamp: false, allowCancelAtPeriodEnd: false };
}

export function subscriptionCancelStateMatchesAction(
  action: MembershipPlanLifecycleAction,
  state: { cancelAt: number | null | undefined; cancelAtPeriodEnd: boolean },
): boolean {
  const expected = expectedCancelStateAfterPlanAction(action);
  if (!expected.allowCancelAtTimestamp && state.cancelAt != null) {
    return false;
  }
  if (!expected.allowCancelAtPeriodEnd && state.cancelAtPeriodEnd) {
    return false;
  }
  return true;
}

/** Upgrade/update leg: do not schedule cancel at period end in the same Stripe call as the plan change. */
export function membershipContinuityUpdateClearsPeriodEndFlag(update: Record<string, unknown>): boolean {
  return update.cancel_at_period_end === false;
}
