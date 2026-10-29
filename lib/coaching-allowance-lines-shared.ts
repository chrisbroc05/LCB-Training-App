import {
  formatMembershipLevelLabel,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import {
  activeMembershipLevel,
  getReviewAllowance,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { formatDateWithYear } from "@/lib/format-date";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import { getPlaybookSubmissionAllowance } from "@/lib/coaching-submissions-shared";

export type CoachingAllowanceLine = {
  id: string;
  label: string;
  detail: string | null;
  canSubmit: boolean;
};

function formatCoreSwingReportLine(
  user: CoachingSubmissionUserFields,
  level: MembershipLevelKey,
  now: Date,
): CoachingAllowanceLine {
  const allowance = getReviewAllowance(user, now);
  const levelLabel = formatMembershipLevelLabel(level);
  const nextEligible = user.coreQuickReportNextEligibleAt
    ? new Date(user.coreQuickReportNextEligibleAt)
    : null;
  const eligibleNow = allowance.canSubmit && allowance.kind === "quick_six_weeks";

  return {
    id: "core-six-week",
    label: `Swing report (${levelLabel})`,
    detail: eligibleNow
      ? "Available now (every 6 weeks)."
      : nextEligible && !Number.isNaN(nextEligible.getTime())
        ? `Next available ${formatDateWithYear(nextEligible)}.`
        : "Not available yet.",
    canSubmit: eligibleNow,
  };
}

function formatPlaybookAllowanceLine(
  user: CoachingSubmissionUserFields,
  now: Date,
): CoachingAllowanceLine | null {
  const playbook = getPlaybookSubmissionAllowance(user, now);
  if (!playbook) {
    return null;
  }
  return {
    id: "playbook-lifetime",
    label: "In-depth breakdown (Playbook)",
    detail:
      playbook.remaining > 0
        ? `${playbook.remaining} left`
        : "You have used your included Playbook submissions.",
    canSubmit: playbook.canSubmit,
  };
}

/** All coaching submission pools visible on dashboard (separate pools, one track per submit). */
export function listCoachingAllowanceLines(
  user: AccessUserFields & CoachingSubmissionUserFields,
  now = new Date(),
): CoachingAllowanceLine[] {
  const lines: CoachingAllowanceLine[] = [];
  const level = activeMembershipLevel(user, now);
  const effective = resolveEffectiveLevel(user, now);

  if (level === "CORE" || level === "PLUS" || level === "ALL_ACCESS") {
    if (effective === "CORE") {
      lines.push(formatCoreSwingReportLine(user, "CORE", now));
    } else if (effective === "ORG_TRIAL") {
      const allowance = getReviewAllowance(user, now);
      lines.push({
        id: "org-trial",
        label: "Swing report (org trial)",
        detail: allowance.canSubmit ? "1 trial swing report available." : "Trial report already used.",
        canSubmit: allowance.canSubmit,
      });
    } else if (effective === "PLUS") {
      const allowance = getReviewAllowance(user, now);
      lines.push({
        id: "plus-monthly",
        label: `In-depth review (${formatMembershipLevelLabel("PLUS")})`,
        detail:
          allowance.remaining > 0
            ? "1 per month. Next one available now."
            : "You have used this month's in-depth review.",
        canSubmit: allowance.canSubmit,
      });
    } else if (effective === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
      lines.push({
        id: "program",
        label: "Program coaching submissions",
        detail: "Included with your program (weekly video breakdown on All-Access).",
        canSubmit: true,
      });
    }
  } else if (effective === "PLAYBOOK") {
    const playbook = getPlaybookSubmissionAllowance(user, now);
    if (playbook) {
      lines.push({
        id: "playbook-lifetime",
        label: "Playbook submissions",
        detail:
          playbook.remaining > 0
            ? `${playbook.remaining} left (${playbook.limit} lifetime).`
            : "You have used your included Playbook submissions.",
        canSubmit: playbook.canSubmit,
      });
    }
  } else if (effective === "FREE") {
    const allowance = getReviewAllowance(user, now);
    lines.push({
      id: "free-once",
      label: "Free submission",
      detail: allowance.canSubmit ? "1 lifetime for new members." : "Already used.",
      canSubmit: allowance.canSubmit,
    });
  } else if (effective === "LEGACY_MEMORABLE" || effective === "LEGACY_ELITE") {
    const allowance = getReviewAllowance(user, now);
    lines.push({
      id: "legacy-monthly",
      label: "Coaching submissions",
      detail: `${allowance.remaining} remaining this month.`,
      canSubmit: allowance.canSubmit,
    });
  }

  if (user.membershipTier === "BASIC" && level && effective !== "PLAYBOOK") {
    const playbookLine = formatPlaybookAllowanceLine(user, now);
    if (playbookLine && !lines.some((line) => line.id === "playbook-lifetime")) {
      lines.push(playbookLine);
    }
  }

  return lines;
}

export function coachingAllowanceLinesCanSubmitAny(
  lines: CoachingAllowanceLine[],
): boolean {
  return lines.some((line) => line.canSubmit);
}
