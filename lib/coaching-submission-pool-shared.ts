import {
  activeMembershipLevel,
  getReviewAllowance,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { formatMembershipLevelLabel, type MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatDateWithYear } from "@/lib/format-date";
import type { CoachingReviewTrack } from "@prisma/client";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import { getPlaybookSubmissionAllowance } from "@/lib/coaching-submissions-shared";

export type CoachingAllowancePoolId =
  | "core-six-week"
  | "playbook-lifetime"
  | "plus-monthly"
  | "program"
  | "org-trial"
  | "free-once"
  | "legacy-monthly";

export type CoachingSubmissionKind = "swing" | "mental";

export type CoachingAllowancePickerOption = {
  poolId: CoachingAllowancePoolId;
  title: string;
  description: string;
  swingFormTitle: string;
  swingFormDescription: string;
  availabilityLine: string;
  canSubmit: boolean;
  supportsSwing: boolean;
  supportsMindset: boolean;
};

const POOL_IDS: CoachingAllowancePoolId[] = [
  "core-six-week",
  "playbook-lifetime",
  "plus-monthly",
  "program",
  "org-trial",
  "free-once",
  "legacy-monthly",
];

export function isCoachingAllowancePoolId(value: string): value is CoachingAllowancePoolId {
  return (POOL_IDS as readonly string[]).includes(value);
}

export function poolIdToReviewTrack(poolId: CoachingAllowancePoolId): CoachingReviewTrack {
  switch (poolId) {
    case "core-six-week":
      return "QUICK_SIX_WEEK";
    case "playbook-lifetime":
      return "PLAYBOOK";
    case "plus-monthly":
    case "legacy-monthly":
      return "IN_DEPTH_MONTHLY";
    case "program":
      return "PROGRAM";
    case "org-trial":
      return "ORG_TRIAL_QUICK";
    case "free-once":
      return "FREE_ONCE";
  }
}

function coreSwingOption(
  user: CoachingSubmissionUserFields,
  level: MembershipLevelKey,
  now: Date,
): CoachingAllowancePickerOption {
  const allowance = getReviewAllowance(user, now);
  const levelLabel = formatMembershipLevelLabel(level);
  const nextEligible = user.coreQuickReportNextEligibleAt
    ? new Date(user.coreQuickReportNextEligibleAt)
    : null;
  const eligibleNow = allowance.canSubmit && allowance.kind === "quick_six_weeks";

  return {
    poolId: "core-six-week",
    title: `Swing report (${levelLabel})`,
    description: "A quick written report on your swing.",
    swingFormTitle: `Quick written report (${levelLabel})`,
    swingFormDescription: "A short written report on your swing.",
    availabilityLine: eligibleNow
      ? "Available now"
      : nextEligible && !Number.isNaN(nextEligible.getTime())
        ? `Next one available ${formatDateWithYear(nextEligible)}`
        : "Not available yet",
    canSubmit: eligibleNow,
    supportsSwing: true,
    supportsMindset: false,
  };
}

function playbookOption(user: CoachingSubmissionUserFields, now: Date): CoachingAllowancePickerOption | null {
  const playbook = getPlaybookSubmissionAllowance(user, now);
  if (!playbook) {
    return null;
  }
  const remaining = playbook.remaining;
  return {
    poolId: "playbook-lifetime",
    title: "In-depth breakdown (Playbook)",
    description: "My full breakdown of your swing or mental game.",
    swingFormTitle: "In-depth breakdown (Playbook)",
    swingFormDescription: "My full breakdown with notes and drills.",
    availabilityLine: remaining > 0 ? `${remaining} left` : "0 left",
    canSubmit: playbook.canSubmit,
    supportsSwing: true,
    supportsMindset: true,
  };
}

function buildAllCoachingAllowanceOptions(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowancePickerOption[] {
  const options: CoachingAllowancePickerOption[] = [];
  const level = activeMembershipLevel(user, now);
  const effective = resolveEffectiveLevel(user, now);

  if (level === "CORE" && effective === "CORE") {
    options.push(coreSwingOption(user, "CORE", now));
  } else if (effective === "ORG_TRIAL") {
    const allowance = getReviewAllowance(user, now);
    options.push({
      poolId: "org-trial",
      title: "Swing report (org trial)",
      description: "A quick written report on your swing.",
      swingFormTitle: "Quick written report (org trial)",
      swingFormDescription: "A short written report on your swing.",
      availabilityLine: allowance.canSubmit ? "Available now" : "Already used",
      canSubmit: allowance.canSubmit,
      supportsSwing: true,
      supportsMindset: false,
    });
  } else if (effective === "PLUS") {
    const allowance = getReviewAllowance(user, now);
    options.push({
      poolId: "plus-monthly",
      title: `In-depth review (${formatMembershipLevelLabel("PLUS")})`,
      description: "My full breakdown of your swing or mental game.",
      swingFormTitle: `In-depth review (${formatMembershipLevelLabel("PLUS")})`,
      swingFormDescription: "My full breakdown with notes and drills.",
      availabilityLine: allowance.remaining > 0 ? "Available now" : "Used this month",
      canSubmit: allowance.canSubmit,
      supportsSwing: true,
      supportsMindset: true,
    });
  } else if (effective === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    options.push({
      poolId: "program",
      title: "Program coaching submission",
      description: "Personal feedback included with your program.",
      swingFormTitle: "Program coaching submission",
      swingFormDescription: "Personal feedback included with your program.",
      availabilityLine: "Available now",
      canSubmit: true,
      supportsSwing: true,
      supportsMindset: true,
    });
  } else if (effective === "PLAYBOOK") {
    const playbook = playbookOption(user, now);
    if (playbook) {
      options.push(playbook);
    }
  } else if (effective === "FREE") {
    const allowance = getReviewAllowance(user, now);
    options.push({
      poolId: "free-once",
      title: "Free submission",
      description: "One swing or mindset submission for new members.",
      swingFormTitle: "Free submission",
      swingFormDescription: "One submission for new members.",
      availabilityLine: allowance.canSubmit ? "Available now" : "Already used",
      canSubmit: allowance.canSubmit,
      supportsSwing: true,
      supportsMindset: true,
    });
  } else if (effective === "LEGACY_MEMORABLE" || effective === "LEGACY_ELITE") {
    const allowance = getReviewAllowance(user, now);
    options.push({
      poolId: "legacy-monthly",
      title: "Coaching submission",
      description: "Personal video feedback from Coach Broc.",
      swingFormTitle: "Coaching submission",
      swingFormDescription: "Personal video feedback from Coach Broc.",
      availabilityLine: `${allowance.remaining} remaining this month`,
      canSubmit: allowance.canSubmit,
      supportsSwing: true,
      supportsMindset: true,
    });
  }

  if (user.membershipTier === "BASIC" && level && effective !== "PLAYBOOK") {
    const playbook = playbookOption(user, now);
    if (playbook && !options.some((option) => option.poolId === "playbook-lifetime")) {
      options.push(playbook);
    }
  }

  return options;
}

/** Hub read-only lines (includes unavailable pools). */
export function listCoachingAllowanceSummaryOptions(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowancePickerOption[] {
  return buildAllCoachingAllowanceOptions(user, now);
}

export function formatCoachingAllowanceSummaryLine(option: CoachingAllowancePickerOption): string {
  return `${option.title} - ${option.description} [${option.availabilityLine}]`;
}

/** Swing form choices (includes disabled options). */
export function listSwingCoachingAllowanceFormOptions(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowancePickerOption[] {
  return buildAllCoachingAllowanceOptions(user, now).filter((option) => option.supportsSwing);
}

export function requiresSwingAllowanceFormChoice(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): boolean {
  return listSwingCoachingAllowanceFormOptions(user, now).length >= 2;
}

/** @deprecated Use requiresSwingAllowanceFormChoice */
export function requiresCoachingAllowancePicker(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): boolean {
  return requiresSwingAllowanceFormChoice(user, now);
}

/** Submittable pools only (legacy helper). */
export function listCoachingAllowancePickerOptions(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowancePickerOption[] {
  return buildAllCoachingAllowanceOptions(user, now).filter((option) => option.canSubmit);
}

export function resolveAutoMindsetPoolId(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowancePoolId | null {
  const eligible = buildAllCoachingAllowanceOptions(user, now).filter(
    (option) => option.supportsMindset && option.canSubmit,
  );
  if (eligible.length === 0) {
    return null;
  }
  const playbook = eligible.find((option) => option.poolId === "playbook-lifetime");
  return playbook?.poolId ?? eligible[0]!.poolId;
}

export function canSubmitMindsetCoachingRequest(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): boolean {
  return resolveAutoMindsetPoolId(user, now) != null;
}

function resolveSingleSubmittableSwingPool(
  options: CoachingAllowancePickerOption[],
): CoachingAllowancePoolId | null {
  const submittable = options.filter((option) => option.canSubmit);
  if (submittable.length !== 1) {
    return null;
  }
  return submittable[0]!.poolId;
}

export type ValidateCoachingPoolResult =
  | { ok: true; poolId: CoachingAllowancePoolId | null; reviewTrack: CoachingReviewTrack | null }
  | { ok: false; error: string };

export function validateCoachingSubmissionPool(
  user: AccessUserFields & CoachingSubmissionUserFields,
  poolId: string | null | undefined,
  kind: CoachingSubmissionKind,
  now = new Date(),
): ValidateCoachingPoolResult {
  if (kind === "mental") {
    const mindsetPool = resolveAutoMindsetPoolId(user, now);
    if (!mindsetPool) {
      return { ok: false, error: "No coaching allowance is available for mindset submissions." };
    }
    return {
      ok: true,
      poolId: mindsetPool,
      reviewTrack: poolIdToReviewTrack(mindsetPool),
    };
  }

  const swingOptions = listSwingCoachingAllowanceFormOptions(user, now);
  if (swingOptions.length === 0) {
    return { ok: false, error: "No coaching submission allowances are available right now." };
  }

  const needsChoice = swingOptions.length >= 2;

  if (poolId && isCoachingAllowancePoolId(poolId) && !swingOptions.some((option) => option.poolId === poolId)) {
    return { ok: false, error: "That coaching allowance is not available." };
  }

  if (needsChoice) {
    if (!poolId || !isCoachingAllowancePoolId(poolId)) {
      return { ok: false, error: "Choose what you want from Coach Broc before submitting." };
    }
    const selected = swingOptions.find((option) => option.poolId === poolId);
    if (!selected) {
      return { ok: false, error: "Invalid coaching allowance selected." };
    }
    if (!selected.canSubmit) {
      return { ok: false, error: "That coaching allowance is not available right now." };
    }
    return {
      ok: true,
      poolId,
      reviewTrack: poolIdToReviewTrack(poolId),
    };
  }

  const autoPool = resolveSingleSubmittableSwingPool(swingOptions);
  if (!autoPool) {
    return { ok: false, error: "No coaching allowance is available for swing submissions." };
  }

  return { ok: true, poolId: null, reviewTrack: null };
}

export function resolveSubmittedCoachingPoolId(
  validation: Extract<ValidateCoachingPoolResult, { ok: true }>,
  user: AccessUserFields & CoachingSubmissionUserFields,
  kind: CoachingSubmissionKind,
  now = new Date(),
): CoachingAllowancePoolId | undefined {
  if (validation.poolId) {
    return validation.poolId;
  }
  if (kind === "swing") {
    const auto = resolveSingleSubmittableSwingPool(listSwingCoachingAllowanceFormOptions(user, now));
    return auto ?? undefined;
  }
  return resolveAutoMindsetPoolId(user, now) ?? undefined;
}

export function isPoolEligibleNow(
  user: CoachingSubmissionUserFields,
  poolId: CoachingAllowancePoolId,
  now = new Date(),
): boolean {
  const option = buildAllCoachingAllowanceOptions(user, now).find((item) => item.poolId === poolId);
  return Boolean(option?.canSubmit);
}
