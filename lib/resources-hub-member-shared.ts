import {
  canDownloadGuideFilename,
  canViewWorkoutInApp,
  getReviewAllowance,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";
import { buildMemberPdfViewerHref } from "@/lib/my-resources-shared";
import type { ResourceDefinition } from "@/lib/resources-shared";
import type { StarterWorkoutProgramKey } from "@/lib/starter-workouts-in-app-shared";
import { formatDateWithYear } from "@/lib/format-date";

export type ResourceHubMemberOverride = {
  includedLabel: string;
  buttonLabel: string;
  href: string;
  hidePrice: boolean;
};

export type ResourceHubMemberSwingCard = {
  title: string;
  description: string;
  includedLabel: string;
  buttonLabel: string;
  href: string;
};

export type ResourcesHubMemberContext = {
  overrides: Record<string, ResourceHubMemberOverride>;
  swingCard: ResourceHubMemberSwingCard | null;
};

const STARTER_SLUG_TO_PROGRAM: Record<string, StarterWorkoutProgramKey> = {
  "starter-strength": "strength",
  "starter-speed": "speed_agility",
  "starter-mobility": "mobility",
};

function guideFilenameFromResource(resource: ResourceDefinition): string | null {
  const key = resource.downloadFileKeys?.[0];
  if (!key) {
    return null;
  }
  const parts = key.split("/");
  return parts[parts.length - 1] ?? null;
}

function includedLabelForAccess(access: AccessUserFields): string | null {
  const effective = resolveEffectiveLevel(access);
  if (effective === "CORE" || effective === "PLUS" || effective === "ALL_ACCESS") {
    const level =
      effective === "CORE" ? "CORE" : effective === "PLUS" ? "PLUS" : "ALL_ACCESS";
    return `Included with ${formatMembershipLevelLabel(level)}`;
  }
  if (effective === "TWELVE_WEEK") {
    return "Included with your 12-Week Program";
  }
  if (effective === "LEGACY_ELITE" || effective === "LEGACY_MEMORABLE") {
    return "Included with your membership";
  }
  if (effective === "ORG_TRIAL") {
    return "Included with your team trial";
  }
  return null;
}

function memberHrefForResource(resource: ResourceDefinition, filename: string): string {
  const key = resource.downloadFileKeys?.[0] ?? "";
  const kind = key.startsWith("guides/") ? "guide" : "workout";
  return buildMemberPdfViewerHref({ kind, file: filename });
}

export function resolveResourceHubMemberOverride(
  access: AccessUserFields,
  resource: ResourceDefinition,
): ResourceHubMemberOverride | null {
  const includedLabel = includedLabelForAccess(access);
  if (!includedLabel) {
    return null;
  }

  const guideFilename = guideFilenameFromResource(resource);
  if (guideFilename && canDownloadGuideFilename(access, guideFilename)) {
    return {
      includedLabel,
      buttonLabel: "Open in app",
      href: memberHrefForResource(resource, guideFilename),
      hidePrice: true,
    };
  }

  const programKey = STARTER_SLUG_TO_PROGRAM[resource.slug];
  if (programKey && canViewWorkoutInApp(access)) {
    return {
      includedLabel,
      buttonLabel: "Open 4-week program",
      href: `/workouts/starters/${programKey}`,
      hidePrice: true,
    };
  }

  if (resource.slug === "starter-bundle" && canViewWorkoutInApp(access)) {
    return {
      includedLabel,
      buttonLabel: "Open starter programs",
      href: "/workouts/starters",
      hidePrice: true,
    };
  }

  return null;
}

export function buildResourceHubMemberOverrides(
  access: AccessUserFields,
  resources: ResourceDefinition[],
): Record<string, ResourceHubMemberOverride> {
  const overrides: Record<string, ResourceHubMemberOverride> = {};
  for (const resource of resources) {
    const override = resolveResourceHubMemberOverride(access, resource);
    if (override) {
      overrides[resource.slug] = override;
    }
  }
  return overrides;
}

export function buildResourceHubMemberSwingCard(
  user: CoachingSubmissionUserFields,
  now = new Date(),
): ResourceHubMemberSwingCard | null {
  const allowance = getReviewAllowance(user, now);
  if (allowance.kind === "free_once" || allowance.kind === "none") {
    return null;
  }

  const includedLabel = includedLabelForAccess(user) ?? "Included with your plan";
  const href = "/coaching-submissions";

  if (allowance.kind === "quick_six_weeks") {
    const nextEligible = user.coreQuickReportNextEligibleAt
      ? formatDateWithYear(user.coreQuickReportNextEligibleAt)
      : null;
    const title = allowance.canSubmit
      ? "Send your swing for your 6-week report"
      : "Your 6-week swing report";
    const description =
      allowance.canSubmit
        ? "Quick written feedback and a drill to work on when you are ready."
        : nextEligible
          ? `Next eligible: ${nextEligible}.`
          : "Your next report is not available yet.";
    return {
      title,
      description,
      includedLabel,
      buttonLabel: allowance.canSubmit ? "Send your swing" : "View submissions",
      href,
    };
  }

  if (allowance.kind === "in_depth_monthly") {
    return {
      title: "In-depth swing review",
      description:
        allowance.canSubmit
          ? "One in-depth review per month is included with Plus. Send video and get detailed feedback."
          : "You have used your in-depth review for this month. It resets at the start of next month.",
      includedLabel,
      buttonLabel: allowance.canSubmit ? "Send for review" : "View submissions",
      href,
    };
  }

  if (allowance.kind === "unlimited") {
    return {
      title: "Coaching submissions",
      description: "Unlimited swing and mindset submissions are included with your program.",
      includedLabel,
      buttonLabel: "Go to submissions",
      href,
    };
  }

  if (allowance.kind === "playbook_lifetime" || allowance.kind === "legacy_monthly") {
    return {
      title: "Coaching submission",
      description: "Your membership includes personal video feedback from Coach Broc.",
      includedLabel,
      buttonLabel: allowance.canSubmit ? "Send for review" : "View submissions",
      href,
    };
  }

  return null;
}
