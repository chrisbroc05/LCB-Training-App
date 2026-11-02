import {
  isFoundingOfferWindowOpen,
  type FoundingOfferOrgFields,
} from "@/lib/founding-offer-shared";
import { formatChicagoMonthDayLabel } from "@/lib/org-trial-dates-shared";

export const ORG_TRIAL_PLAYBOOK_DESCRIPTION =
  "The Next Level Playbook is my four-chapter interactive guide to the mental side of the game and how to train with a purpose. Players work through it at their own pace, with prompts and drills along the way. It's the same approach I use with every player I coach.";

export const ORG_TRIAL_PLAYBOOK_UNLOCK_WITH_PLUS_LINE =
  "The full Playbook unlocks in January with Plus.";

const FOUNDING_PLUS_MONTHLY_PRICE_LABEL = "$15 a month";

export function buildOrgTrialPlaybookFoundingLine(params: {
  orgName: string | null;
  founding: FoundingOfferOrgFields | null | undefined;
  now?: Date;
}): string | null {
  if (!params.founding || !isFoundingOfferWindowOpen(params.founding, params.now)) {
    return null;
  }
  if (!params.founding.foundingOfferDeadline) {
    return null;
  }
  const deadlineLabel = formatChicagoMonthDayLabel(params.founding.foundingOfferDeadline);
  if (!deadlineLabel) {
    return null;
  }
  const orgLabel = params.orgName?.trim() || "Your club";
  const months = Math.max(1, params.founding.foundingOfferMonths);
  const periodLabel =
    months === 12 ? "first year" : `first ${months} months`;
  return `${orgLabel} families who join Plus by ${deadlineLabel} get the founding price of ${FOUNDING_PLUS_MONTHLY_PRICE_LABEL} for their ${periodLabel}.`;
}

export type OrgTrialPlaybookLockedCopy = {
  description: string;
  unlockLine: string;
  foundingLine: string | null;
};

export function buildOrgTrialPlaybookLockedCopy(params: {
  orgName: string | null;
  founding: FoundingOfferOrgFields | null | undefined;
  now?: Date;
}): OrgTrialPlaybookLockedCopy {
  return {
    description: ORG_TRIAL_PLAYBOOK_DESCRIPTION,
    unlockLine: ORG_TRIAL_PLAYBOOK_UNLOCK_WITH_PLUS_LINE,
    foundingLine: buildOrgTrialPlaybookFoundingLine(params),
  };
}
