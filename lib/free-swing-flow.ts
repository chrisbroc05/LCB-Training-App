export const LANDING_SWING_BANNER_DISMISSED_KEY = "lcb-landing-swing-banner-dismissed";
export const PENDING_COACHING_WELCOME_KEY = "lcb-pending-coaching-welcome";
export const COACHING_WELCOME_SEEN_KEY = "lcb-coaching-welcome-seen";
export const FREE_SWING_AUTH_REDIRECT = "coaching-submissions";

export const FREE_SWING_AUTH_URL = `/auth?tier=free&redirect=${FREE_SWING_AUTH_REDIRECT}`;

export function isFreeSwingAuthFlow(tier: string | null, redirect: string | null) {
  return tier?.toLowerCase() === "free" && redirect === FREE_SWING_AUTH_REDIRECT;
}

export function markPendingCoachingWelcome() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PENDING_COACHING_WELCOME_KEY, "1");
}

export function getAuthRedirectParam(redirect: string | null, callbackUrl: string | null) {
  return redirect ?? callbackUrl;
}

export function getPostAuthRedirectPath(redirect: string | null, callbackUrl?: string | null) {
  const target = getAuthRedirectParam(redirect, callbackUrl ?? null);

  if (target === FREE_SWING_AUTH_REDIRECT) {
    return "/coaching-submissions";
  }

  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }

  return "/dashboard";
}
