import type { DatabaseTier, TierKey } from "@/lib/membership";
import { isFreeSwingAuthFlow } from "@/lib/free-swing-flow";

const PLAYBOOK_TIERS = new Set(["basic", "memorable", "elite"]);

export const PLAYBOOK_INCLUDED_ITEMS = [
  "The Next Level Playbook -- 4 interactive chapters with reflection questions",
  "1 personal swing or video breakdown from Coach Broc (lifetime)",
  "Starter set of drills from the drill library",
  "Mental Game Workbook, Pre-Game Warmup Routine, Parent Guide, and Nutrition Guide",
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
  level?: string | null;
  orgCode?: string | null;
  searchParams?: Pick<URLSearchParams, "get">;
};

export function buildAuthPageHref(options: AuthPageHrefOptions) {
  const params = new URLSearchParams();
  const keys = [
    "tier",
    "redirect",
    "callbackUrl",
    "billing",
    "checkout",
    "intent",
    "level",
    "orgCode",
  ] as const;

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

  if (selectedTier === "memorable" || selectedTier === "elite") {
    return "Create My Free Account";
  }

  return "Create Account and Unlock The Playbook -- $59";
}

export function getPlaybookResumeCheckoutButtonLabel(pendingTier: DatabaseTier) {
  if (pendingTier === "MEMORABLE" || pendingTier === "ELITE") {
    return "Continue to Checkout";
  }

  if (pendingTier === "TWELVE_WEEK") {
    return "Continue to 12-Week Program Checkout";
  }

  return "Continue to Playbook Checkout";
}
