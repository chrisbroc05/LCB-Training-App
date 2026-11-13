export const PENDING_COACHING_WELCOME_KEY = "lcb-pending-coaching-welcome";
export const COACHING_WELCOME_SEEN_KEY = "lcb-coaching-welcome-seen";

/** Public marketing page for the free swing offer. */
export const FREE_SWING_LANDING_PATH = "/free-swing-breakdown";

/** In-app swing submission form (requires login). */
export const FREE_SWING_FORM_PATH = "/swing-analysis";

/** Auth redirect token (no leading slash) used by signup flow. */
export const FREE_SWING_AUTH_REDIRECT = "swing-analysis";

export const FREE_SWING_AUTH_URL = `/auth?tier=free&redirect=${FREE_SWING_AUTH_REDIRECT}`;

export function isFreeSwingAuthFlow(tier: string | null, redirect: string | null) {
  return (
    tier?.toLowerCase() === "free" &&
    (redirect === FREE_SWING_AUTH_REDIRECT ||
      redirect === FREE_SWING_FORM_PATH ||
      redirect === "coaching-submissions")
  );
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

  if (
    target === FREE_SWING_AUTH_REDIRECT ||
    target === FREE_SWING_FORM_PATH ||
    target === "coaching-submissions" ||
    target === "/coaching-submissions"
  ) {
    return FREE_SWING_FORM_PATH;
  }

  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }

  return "/dashboard";
}
