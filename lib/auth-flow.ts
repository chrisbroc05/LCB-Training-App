import type { DatabaseTier, TierKey } from "@/lib/membership";
import { isFreeSwingAuthFlow } from "@/lib/free-swing-flow";

export const PLAYBOOK_INCLUDED_ITEMS = [
  "The Next Level Playbook -- 4 interactive chapters with reflection questions",
  "Full hitting, fielding, and mindset video drill library",
  "8 downloadable workout programs",
  "Pre-Game Warmup Routine, Nutrition Guide, Mental Game Workbook, and Parent Guide",
  "Downloadable PDF of your completed playbook with your personal answers",
  "Lifetime access -- pay once, never pay again",
] as const;

export function isPlaybookSignupFlow(tier: string | null, redirect: string | null) {
  return !isFreeSwingAuthFlow(tier, redirect);
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
