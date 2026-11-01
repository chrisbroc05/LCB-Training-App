import type { AccountRole } from "@/lib/account-shared";
import type { DatabaseTier } from "@/lib/membership";
import { isMembershipLevelKey, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { isUnder13PlayerAge } from "@/lib/legal-shared";

export const PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS = 24 * 60 * 60 * 1000;

export const PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP = "parent_account_signup";
export const PARENT_CONSENT_METHOD_EMAIL_CONFIRM = "parent_email_confirm";
export const PARENT_CONSENT_METHOD_PAYMENT = "parent_payment";

export type ParentConsentMethod =
  | typeof PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP
  | typeof PARENT_CONSENT_METHOD_EMAIL_CONFIRM
  | typeof PARENT_CONSENT_METHOD_PAYMENT;

export function hasPaidSignupCheckoutIntent(params: {
  pendingCheckoutLevel?: MembershipLevelKey | null;
  signupSource?: string | null;
  selectedMembershipTier?: DatabaseTier | null;
}): boolean {
  if (params.pendingCheckoutLevel && isMembershipLevelKey(params.pendingCheckoutLevel)) {
    return true;
  }
  const source = params.signupSource?.trim().toLowerCase() ?? "";
  if (source === "program") {
    return true;
  }
  if (source === "playbook") {
    return params.selectedMembershipTier === "BASIC";
  }
  return false;
}

export type Under13ParentLockInput = {
  playerAge?: number | null;
  parentConsentEmail?: string | null;
  parentConsentConfirmedAt?: Date | string | null;
  accountRole?: AccountRole | null;
  parentConsentMethod?: string | null;
  termsAcceptedAt?: Date | string | null;
  now?: Date;
};

export type ParentSignupDeferralFallbackReason = "checkout_canceled" | "deferral_expired";

export function isParentAccountSignupCheckoutDeferralActive(params: {
  accountRole?: AccountRole | null;
  parentConsentMethod?: string | null;
  parentConsentConfirmedAt?: Date | string | null;
  termsAcceptedAt?: Date | string | null;
  now?: Date;
}): boolean {
  if (params.accountRole !== "PARENT") {
    return false;
  }
  if (params.parentConsentMethod !== PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP) {
    return false;
  }
  if (params.parentConsentConfirmedAt) {
    return false;
  }
  const acceptedAt = params.termsAcceptedAt ? new Date(params.termsAcceptedAt) : null;
  if (!acceptedAt || Number.isNaN(acceptedAt.getTime())) {
    return false;
  }
  const now = params.now ?? new Date();
  return now.getTime() - acceptedAt.getTime() < PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS;
}

export function shouldFallbackDeferredParentAccountSignup(params: {
  accountRole?: AccountRole | null;
  parentConsentMethod?: string | null;
  parentConsentConfirmedAt?: Date | string | null;
  termsAcceptedAt?: Date | string | null;
  reason: ParentSignupDeferralFallbackReason;
  now?: Date;
}): boolean {
  if (params.accountRole !== "PARENT") {
    return false;
  }
  if (params.parentConsentMethod !== PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP) {
    return false;
  }
  if (params.parentConsentConfirmedAt) {
    return false;
  }
  if (params.reason === "checkout_canceled") {
    return true;
  }
  return !isParentAccountSignupCheckoutDeferralActive(params);
}

/** Under-13 lock for PLAYER minors and PARENT free signups; not during active paid-checkout deferral. */
export function needsUnder13ParentConfirmationLock(state: Under13ParentLockInput): boolean {
  if (!isUnder13PlayerAge(state.playerAge)) {
    return false;
  }

  if (!state.parentConsentEmail?.trim()) {
    return false;
  }

  if (state.parentConsentConfirmedAt) {
    return false;
  }

  if (
    state.accountRole === "PARENT" &&
    state.parentConsentMethod === PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP &&
    isParentAccountSignupCheckoutDeferralActive(state)
  ) {
    return false;
  }

  return true;
}

export type Under13ParentConsentGateMode =
  | "player_waiting_on_parent"
  | "parent_verify_email"
  | null;

export function resolveUnder13ParentConsentGateMode(params: {
  needsUnder13ParentLock: boolean;
  accountRole?: AccountRole | null;
}): Under13ParentConsentGateMode {
  if (!params.needsUnder13ParentLock) {
    return null;
  }
  if (params.accountRole === "PARENT") {
    return "parent_verify_email";
  }
  return "player_waiting_on_parent";
}
