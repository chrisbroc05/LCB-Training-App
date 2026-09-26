import type { DatabaseTier, TierKey } from "@/lib/membership";
import { isFreeSwingAuthFlow } from "@/lib/free-swing-flow";

const PLAYBOOK_TIERS = new Set(["basic", "memorable", "elite"]);

export const PLAYBOOK_INCLUDED_ITEMS = [
  "The Next Level Playbook -- 4 interactive chapters with reflection questions",
  "Full hitting, fielding, and mindset video drill library",
  "8 downloadable workout programs",
  "Pre-Game Warmup Routine, Nutrition Guide, Mental Game Workbook, and Parent Guide",
  "Downloadable PDF of your completed playbook with your personal answers",
  "Lifetime access -- pay once, never pay again",
] as const;

export function isProgramSignupFlow(tier: string | null, redirect: string | null) {
  if (redirect?.includes("startCheckout=1")) {
    return true;
  }

  const normalizedTier = tier?.toLowerCase();
  return normalizedTier === "twelveweek" || normalizedTier === "twelve_week";
}

export function isPlaybookSignupFlow(tier: string | null, redirect: string | null) {
  if (isFreeSwingAuthFlow(tier, redirect)) {
    return false;
  }

  if (isProgramSignupFlow(tier, redirect)) {
    return false;
  }

  const normalizedTier = tier?.toLowerCase();
  return normalizedTier ? PLAYBOOK_TIERS.has(normalizedTier) : false;
}

type AuthPageHrefOptions = {
  mode?: "login" | "signup";
  tier?: string | null;
  redirect?: string | null;
  callbackUrl?: string | null;
  billing?: string | null;
  checkout?: string | null;
  intent?: string | null;
  searchParams?: Pick<URLSearchParams, "get">;
};

export function buildAuthPageHref(options: AuthPageHrefOptions) {
  const params = new URLSearchParams();
  const keys = ["tier", "redirect", "callbackUrl", "billing", "checkout", "intent"] as const;

  if (options.mode) {
    params.set("mode", options.mode);
  }

  for (const key of keys) {
    const explicitValue = options[key];
    if (explicitValue) {
      params.set(key, explicitValue);
      continue;
    }

    const searchValue = options.searchParams?.get(key);
    if (searchValue) {
      params.set(key, searchValue);
    }
  }

  const query = params.toString();
  return query ? `/auth?${query}` : "/auth";
}

export function getPlaybookSignupButtonLabel(selectedTier: TierKey) {
  if (selectedTier === "free") {
    return "Create My Free Account";
  }

  if (selectedTier === "memorable") {
    return "Create Account and Add Coaching -- $149/month";
  }

  if (selectedTier === "elite") {
    return "Create Account and Go Elite -- $249/month";
  }

  return "Create Account and Unlock The Playbook -- $59";
}

export function getPlaybookResumeCheckoutButtonLabel(pendingTier: DatabaseTier) {
  if (pendingTier === "MEMORABLE") {
    return "Continue to Memorable Checkout";
  }

  if (pendingTier === "ELITE") {
    return "Continue to Elite Checkout";
  }

  return "Continue to Playbook Checkout";
}
