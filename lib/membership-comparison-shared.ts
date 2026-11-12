/**
 * Membership comparison: step-up cards + detail grid (client-safe).
 * Grid cells stay tied to access-shared gates.
 */

import {
  canAccessGoalCheckin,
  canDownloadGuideFilename,
  canMessageCoach,
  canViewPlaybook,
  getReviewAllowance,
  getWorkoutAccessMode,
  hasFullDrillLibraryAccess,
  hasPersonalProgramDashboard,
  isCoreBandEffective,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { EXTRA_REVIEW_PRICE_DISPLAY } from "@/lib/extra-review-shared";
import {
  MEMBERSHIP_LEVELS,
  MEMBERSHIP_LEVEL_KEYS,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import {
  isFoundingOfferWindowOpen,
  type FoundingOfferOrgFields,
} from "@/lib/founding-offer-shared";
import { formatChicagoMonthDayLabel } from "@/lib/org-trial-dates-shared";

export type MembershipComparisonCell = {
  kind: "check" | "dash" | "text";
  text?: string;
};

export type MembershipComparisonRow = {
  id: string;
  label: string;
  cells: Record<MembershipLevelKey, MembershipComparisonCell>;
};

export type MembershipFoundingPlusHighlight = {
  orgName: string;
  deadlineLabel: string;
  line: string;
};

export type MembershipStepUpCard = {
  key: MembershipLevelKey;
  displayName: string;
  recommended: boolean;
  includesPriorLabel: string | null;
  bullets: string[];
};

export const MEMBERSHIP_COMPARISON_SUBTITLE = "Pick the level that fits your player.";

export const MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE = `Extra video reviews available for ${EXTRA_REVIEW_PRICE_DISPLAY}.`;

const RECRUITING_GUIDE = "LCB_Recruiting_Guide.pdf";
const SAMPLE_CORE_GUIDE = "LCB_PreGame_Warmup.pdf";
const SAMPLE_PLUS_GUIDE = "LCB_Mental_Game_Workbook.pdf";

function accessUserForLevel(level: MembershipLevelKey): AccessUserFields {
  return {
    membershipTier: "FREE",
    membershipLevel: level,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
  };
}

function reviewUserForLevel(
  level: MembershipLevelKey,
): AccessUserFields & CoachingSubmissionUserFields {
  return {
    ...accessUserForLevel(level),
    freeSubmissionUsed: false,
    orgTrialQuickReportUsed: false,
    coachingSubmissionsUsedThisMonth: 0,
    coachingSubmissionPeriod: null,
    eliteRolloverCredits: 0,
    coreQuickReportNextEligibleAt: null,
    playbookSubmissionsUsed: 0,
  };
}

function check(): MembershipComparisonCell {
  return { kind: "check" };
}

function dash(): MembershipComparisonCell {
  return { kind: "dash" };
}

function text(value: string): MembershipComparisonCell {
  return { kind: "text", text: value };
}

function hasStarterDrills(user: AccessUserFields): boolean {
  return isCoreBandEffective(resolveEffectiveLevel(user)) || hasFullDrillLibraryAccess(user);
}

/**
 * Plus gets in-depth monthly only (not also Core's written every-6-weeks pool).
 */
function swingFeedbackCell(level: MembershipLevelKey): MembershipComparisonCell {
  const allowance = getReviewAllowance(reviewUserForLevel(level));
  if (allowance.kind === "quick_six_weeks") {
    return text("Written report every 6 weeks");
  }
  if (allowance.kind === "in_depth_monthly") {
    return text("1 in-depth video review per month");
  }
  if (allowance.kind === "unlimited") {
    return text("Weekly video review + progress check-in");
  }
  return dash();
}

function programFeatureCell(level: MembershipLevelKey): MembershipComparisonCell {
  return cellFromBoolean(hasPersonalProgramDashboard(accessUserForLevel(level)));
}

function goalCheckinFeatureCell(level: MembershipLevelKey): MembershipComparisonCell {
  return cellFromBoolean(canAccessGoalCheckin(accessUserForLevel(level)));
}

function guidesCell(user: AccessUserFields): MembershipComparisonCell {
  if (canDownloadGuideFilename(user, SAMPLE_PLUS_GUIDE)) {
    return text("All guides");
  }
  if (canDownloadGuideFilename(user, SAMPLE_CORE_GUIDE)) {
    return text("Starter guides");
  }
  return dash();
}

function cellFromBoolean(included: boolean): MembershipComparisonCell {
  return included ? check() : dash();
}

/** Step-up marketing cards (aligned with access rules). */
export function listMembershipStepUpCards(): MembershipStepUpCard[] {
  return [
    {
      key: "CORE",
      displayName: MEMBERSHIP_LEVELS.CORE.displayName,
      recommended: false,
      includesPriorLabel: null,
      bullets: [
        "Starter drills and starter workouts",
        "Starter guides",
        "Written swing report from Coach Broc every 6 weeks",
        "Daily Challenge + leaderboard",
      ],
    },
    {
      key: "PLUS",
      displayName: MEMBERSHIP_LEVELS.PLUS.displayName,
      recommended: true,
      includesPriorLabel: "Everything in Core, plus:",
      bullets: [
        "Full drill library",
        "Full workout programs",
        "All guides + the Playbook",
        "1 in-depth video review per month (replaces the written report)",
        "Messaging with Coach Broc",
        MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE,
      ],
    },
    {
      key: "ALL_ACCESS",
      displayName: MEMBERSHIP_LEVELS.ALL_ACCESS.displayName,
      recommended: false,
      includesPriorLabel: "Everything in Plus, plus:",
      bullets: [
        "1-on-1 coaching: a personalized daily plan built for your player",
        "Weekly focus and custom tasks set by Coach Broc",
        "Weekly video review and progress check-in (replaces the monthly review)",
        "Monthly goal setting in the app, reviewed by Coach Broc",
        "Game and practice logging, plus a weekly recap email for parents",
        "Kickoff call with Coach Broc and a parent to get set up",
        "College Baseball Recruiting Guide",
      ],
    },
  ];
}

/** Detail grid rows for Core / Plus / All-Access, driven by access-shared. */
export function listMembershipComparisonRows(): MembershipComparisonRow[] {
  const byLevel = Object.fromEntries(
    MEMBERSHIP_LEVEL_KEYS.map((level) => [level, accessUserForLevel(level)]),
  ) as Record<MembershipLevelKey, AccessUserFields>;

  return [
    {
      id: "starter-drills",
      label: "Starter drills",
      cells: {
        CORE: cellFromBoolean(hasStarterDrills(byLevel.CORE)),
        PLUS: cellFromBoolean(hasStarterDrills(byLevel.PLUS)),
        ALL_ACCESS: cellFromBoolean(hasStarterDrills(byLevel.ALL_ACCESS)),
      },
    },
    {
      id: "full-drill-library",
      label: "Full drill library",
      cells: {
        CORE: cellFromBoolean(hasFullDrillLibraryAccess(byLevel.CORE)),
        PLUS: cellFromBoolean(hasFullDrillLibraryAccess(byLevel.PLUS)),
        ALL_ACCESS: cellFromBoolean(hasFullDrillLibraryAccess(byLevel.ALL_ACCESS)),
      },
    },
    {
      id: "starter-workouts",
      label: "Starter workouts",
      cells: {
        CORE: cellFromBoolean(getWorkoutAccessMode(byLevel.CORE) !== "none"),
        PLUS: cellFromBoolean(getWorkoutAccessMode(byLevel.PLUS) !== "none"),
        ALL_ACCESS: cellFromBoolean(getWorkoutAccessMode(byLevel.ALL_ACCESS) !== "none"),
      },
    },
    {
      id: "full-workout-programs",
      label: "Full workout programs",
      cells: {
        CORE: cellFromBoolean(getWorkoutAccessMode(byLevel.CORE) === "full_programs"),
        PLUS: cellFromBoolean(getWorkoutAccessMode(byLevel.PLUS) === "full_programs"),
        ALL_ACCESS: cellFromBoolean(getWorkoutAccessMode(byLevel.ALL_ACCESS) === "full_programs"),
      },
    },
    {
      id: "swing-feedback",
      label: "Swing feedback from Coach Broc",
      cells: {
        CORE: swingFeedbackCell("CORE"),
        PLUS: swingFeedbackCell("PLUS"),
        ALL_ACCESS: swingFeedbackCell("ALL_ACCESS"),
      },
    },
    {
      id: "playbook",
      label: "Playbook",
      cells: {
        CORE: cellFromBoolean(canViewPlaybook(byLevel.CORE)),
        PLUS: cellFromBoolean(canViewPlaybook(byLevel.PLUS)),
        ALL_ACCESS: cellFromBoolean(canViewPlaybook(byLevel.ALL_ACCESS)),
      },
    },
    {
      id: "guides",
      label: "Guides",
      cells: {
        CORE: guidesCell(byLevel.CORE),
        PLUS: guidesCell(byLevel.PLUS),
        ALL_ACCESS: guidesCell(byLevel.ALL_ACCESS),
      },
    },
    {
      id: "messaging",
      label: "Messaging with Coach Broc",
      cells: {
        CORE: cellFromBoolean(canMessageCoach(byLevel.CORE)),
        PLUS: cellFromBoolean(canMessageCoach(byLevel.PLUS)),
        ALL_ACCESS: cellFromBoolean(canMessageCoach(byLevel.ALL_ACCESS)),
      },
    },
    {
      id: "recruiting-guide",
      label: "Recruiting Guide",
      cells: {
        CORE: cellFromBoolean(canDownloadGuideFilename(byLevel.CORE, RECRUITING_GUIDE)),
        PLUS: cellFromBoolean(canDownloadGuideFilename(byLevel.PLUS, RECRUITING_GUIDE)),
        ALL_ACCESS: cellFromBoolean(canDownloadGuideFilename(byLevel.ALL_ACCESS, RECRUITING_GUIDE)),
      },
    },
    {
      id: "daily-challenge",
      label: "Daily Challenge + leaderboard",
      cells: {
        CORE: check(),
        PLUS: check(),
        ALL_ACCESS: check(),
      },
    },
    {
      id: "daily-plan",
      label: "1-on-1 coaching with a personalized daily plan",
      cells: {
        CORE: programFeatureCell("CORE"),
        PLUS: programFeatureCell("PLUS"),
        ALL_ACCESS: programFeatureCell("ALL_ACCESS"),
      },
    },
    {
      id: "weekly-focus-tasks",
      label: "Weekly focus + custom tasks",
      cells: {
        CORE: programFeatureCell("CORE"),
        PLUS: programFeatureCell("PLUS"),
        ALL_ACCESS: programFeatureCell("ALL_ACCESS"),
      },
    },
    {
      id: "monthly-goals",
      label: "Monthly goal setting (reviewed by Coach Broc)",
      cells: {
        CORE: goalCheckinFeatureCell("CORE"),
        PLUS: goalCheckinFeatureCell("PLUS"),
        ALL_ACCESS: goalCheckinFeatureCell("ALL_ACCESS"),
      },
    },
    {
      id: "game-practice-logging",
      label: "Game and practice logging + parent weekly recap",
      cells: {
        CORE: programFeatureCell("CORE"),
        PLUS: programFeatureCell("PLUS"),
        ALL_ACCESS: programFeatureCell("ALL_ACCESS"),
      },
    },
    {
      id: "kickoff-call",
      label: "Kickoff call",
      cells: {
        CORE: programFeatureCell("CORE"),
        PLUS: programFeatureCell("PLUS"),
        ALL_ACCESS: programFeatureCell("ALL_ACCESS"),
      },
    },
  ];
}

export function listMembershipComparisonColumns() {
  return MEMBERSHIP_LEVEL_KEYS.map((key) => ({
    key,
    displayName: MEMBERSHIP_LEVELS[key].displayName,
    priceDisplay: MEMBERSHIP_LEVELS[key].priceDisplay,
    note: key === "PLUS" ? MEMBERSHIP_COMPARISON_PLUS_EXTRA_REVIEW_NOTE : null,
  }));
}

export function buildMembershipFoundingPlusHighlight(params: {
  orgName?: string | null;
  founding: FoundingOfferOrgFields | null | undefined;
  now?: Date;
}): MembershipFoundingPlusHighlight | null {
  const founding = params.founding ?? null;
  if (!founding || !isFoundingOfferWindowOpen(founding, params.now)) {
    return null;
  }
  const deadlineLabel = formatChicagoMonthDayLabel(founding.foundingOfferDeadline);
  if (!deadlineLabel) {
    return null;
  }
  const orgName = params.orgName?.trim() || "Your club";
  return {
    orgName,
    deadlineLabel,
    line: `${orgName} founding price: $15/mo (normally $20) if you join by ${deadlineLabel}`,
  };
}

/**
 * Founding note: logged-in org members with an active founding offer only.
 * Never for logged-out visitors or members without an org founding window.
 */
export function resolveMembershipFoundingPlusHighlight(params: {
  signedIn: boolean;
  organizationId?: string | null;
  orgName?: string | null;
  founding?: FoundingOfferOrgFields | null;
  now?: Date;
}): MembershipFoundingPlusHighlight | null {
  if (!params.signedIn || !params.organizationId) {
    return null;
  }
  return buildMembershipFoundingPlusHighlight({
    orgName: params.orgName,
    founding: params.founding,
    now: params.now,
  });
}

export function formatMembershipComparisonCell(cell: MembershipComparisonCell): string {
  if (cell.kind === "check") {
    return "Yes";
  }
  if (cell.kind === "dash") {
    return "-";
  }
  return cell.text ?? "-";
}

export function chooseMembershipLevelButtonLabel(level: MembershipLevelKey): string {
  return `Choose ${MEMBERSHIP_LEVELS[level].displayName}`;
}
