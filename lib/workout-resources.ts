import {
  canAccessPlaybookContent,
  hasPlaybookWorkoutProgramDownloads,
  type PlaybookEntitlementFields,
} from "@/lib/playbook-entitlements-shared";
import { isTwelveWeekProgramMember, type DatabaseTier } from "@/lib/membership";

export type WorkoutResourceTier = "basic" | "memorable" | "elite";

export type WorkoutResourceAccessKind =
  | "playbook_guide"
  | "legacy_playbook_bonus"
  | "twelve_week_only";

export type WorkoutResource = {
  filename: string;
  title: string;
  description: string;
  requiredTier: WorkoutResourceTier;
  accessKind: WorkoutResourceAccessKind;
  actionLabel: string;
};

export type WorkoutResourceGroup = {
  heading: string;
  requiredTier: WorkoutResourceTier;
  resources: WorkoutResource[];
};

export const PLAYBOOK_INCLUDED_GUIDE_FILENAMES = [
  "LCB_PreGame_Warmup.pdf",
  "LCB_Nutrition_Guide.pdf",
  "LCB_Mental_Game_Workbook.pdf",
  "LCB_Parent_Guide.pdf",
] as const;

export const workoutResourceGroups: WorkoutResourceGroup[] = [
  {
    heading: "Included with The Playbook",
    requiredTier: "basic",
    resources: [
      {
        filename: "LCB_PreGame_Warmup.pdf",
        title: "Pre-Game Warmup Routine",
        description: "A structured warmup routine to prepare athletes before games and practices.",
        requiredTier: "basic",
        accessKind: "playbook_guide",
        actionLabel: "View Routine",
      },
      {
        filename: "LCB_Nutrition_Guide.pdf",
        title: "Nutrition and Fueling Guide",
        description: "Fuel and recovery guidance built for baseball athletes.",
        requiredTier: "basic",
        accessKind: "playbook_guide",
        actionLabel: "View Guide",
      },
      {
        filename: "LCB_Mental_Game_Workbook.pdf",
        title: "Mental Game Workbook",
        description: "Exercises and prompts to strengthen confidence, focus, and composure.",
        requiredTier: "basic",
        accessKind: "playbook_guide",
        actionLabel: "View Workbook",
      },
      {
        filename: "LCB_Parent_Guide.pdf",
        title: "Parent Guide",
        description: "Support strategies for parents helping athletes grow on and off the field.",
        requiredTier: "basic",
        accessKind: "playbook_guide",
        actionLabel: "View Guide",
      },
      {
        filename: "LCB_Rotational_Sample.pdf",
        title: "Rotational Power Sample",
        description: "Sample rotational power work from Coach Broc.",
        requiredTier: "basic",
        accessKind: "legacy_playbook_bonus",
        actionLabel: "View Sample",
      },
    ],
  },
  {
    heading: "12-Week Program",
    requiredTier: "elite",
    resources: [
      {
        filename: "LCB_Recruiting_Guide.pdf",
        title: "College Baseball Recruiting Guide",
        description: "A roadmap for navigating the college baseball recruiting process.",
        requiredTier: "elite",
        accessKind: "twelve_week_only",
        actionLabel: "View Guide",
      },
    ],
  },
];

const workoutResourceByFilename = new Map(
  workoutResourceGroups.flatMap((group) =>
    group.resources.map((resource) => [resource.filename, resource] as const),
  ),
);

export function getWorkoutResource(filename: string) {
  return workoutResourceByFilename.get(filename);
}

export function getWorkoutResourceUrl(filename: string) {
  return `/api/workout-resources/${filename}`;
}

export function canAccessWorkoutResourceFile(
  user: PlaybookEntitlementFields,
  filename: string,
): boolean {
  const resource = getWorkoutResource(filename);
  if (!resource) {
    return false;
  }

  if (resource.accessKind === "twelve_week_only") {
    return isTwelveWeekProgramMember(user.membershipTier);
  }

  if (resource.accessKind === "playbook_guide") {
    return canAccessPlaybookContent(user);
  }

  if (resource.accessKind === "legacy_playbook_bonus") {
    return hasPlaybookWorkoutProgramDownloads(user);
  }

  return false;
}

/** @deprecated Use canAccessWorkoutResourceFile with playbookLegacyAccess. */
export function canAccessWorkoutResource(
  membershipTier: DatabaseTier,
  requiredTier: WorkoutResourceTier,
  playbookLegacyAccess = false,
) {
  const user: PlaybookEntitlementFields = { membershipTier, playbookLegacyAccess };
  if (requiredTier === "elite" && isTwelveWeekProgramMember(membershipTier)) {
    return true;
  }
  return hasPlaybookWorkoutProgramDownloads(user);
}

export function getWorkoutResourceUpgradeLabel(requiredTier: WorkoutResourceTier) {
  if (requiredTier === "basic") {
    return "Upgrade to Basic";
  }

  return "See the program";
}

export function getWorkoutResourceUpgradeHref(requiredTier: WorkoutResourceTier) {
  if (requiredTier === "basic") {
    return "/upgrade?reason=basic-required";
  }

  return "/program";
}

export function getWorkoutResourceLockMessage(
  resource: WorkoutResource,
  title: string,
) {
  if (resource.accessKind === "legacy_playbook_bonus") {
    return `${title} is included with full Playbook (legacy) or the 12-Week Program.`;
  }
  if (resource.accessKind === "twelve_week_only") {
    return "Included in the 12-Week Program.";
  }
  if (resource.requiredTier === "basic") {
    return `${title} is included with The Playbook.`;
  }

  return "Included in the 12-Week Program.";
}

export function listDownloadableWorkoutResourcesForUser(user: PlaybookEntitlementFields) {
  return workoutResourceGroups.flatMap((group) =>
    group.resources.filter((resource) => canAccessWorkoutResourceFile(user, resource.filename)),
  );
}
