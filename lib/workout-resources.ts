import { hasDatabaseTierAccess, type DatabaseTier, type TierKey } from "@/lib/membership";

export type WorkoutResourceTier = Extract<TierKey, "basic" | "memorable" | "elite">;

export type WorkoutResource = {
  filename: string;
  title: string;
  description: string;
  requiredTier: WorkoutResourceTier;
};

export type WorkoutResourceGroup = {
  heading: string;
  requiredTier: WorkoutResourceTier;
  resources: WorkoutResource[];
};

export const workoutResourceGroups: WorkoutResourceGroup[] = [
  {
    heading: "Basic and Above",
    requiredTier: "basic",
    resources: [
      {
        filename: "LCB_PreGame_Warmup.pdf",
        title: "Pre-Game Warmup Routine",
        description: "A structured warmup routine to prepare athletes before games and practices.",
        requiredTier: "basic",
      },
      {
        filename: "LCB_Nutrition_Guide.pdf",
        title: "Nutrition & Fueling Guide",
        description: "Nutrition and fueling guidance built for baseball athletes.",
        requiredTier: "basic",
      },
    ],
  },
  {
    heading: "Memorable and Above",
    requiredTier: "memorable",
    resources: [
      {
        filename: "LCB_Mental_Game_Workbook.pdf",
        title: "The Mental Game Workbook",
        description: "Exercises and prompts to strengthen confidence, focus, and composure.",
        requiredTier: "memorable",
      },
      {
        filename: "LCB_Parent_Guide.pdf",
        title: "The Parent Guide",
        description: "Support strategies for parents helping athletes grow on and off the field.",
        requiredTier: "memorable",
      },
    ],
  },
  {
    heading: "Elite Only",
    requiredTier: "elite",
    resources: [
      {
        filename: "LCB_Recruiting_Guide.pdf",
        title: "College Baseball Recruiting Guide",
        description: "A roadmap for navigating the college baseball recruiting process.",
        requiredTier: "elite",
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

export function canAccessWorkoutResource(
  membershipTier: DatabaseTier,
  requiredTier: WorkoutResourceTier,
) {
  return hasDatabaseTierAccess(membershipTier, requiredTier);
}

export function getWorkoutResourceUpgradeLabel(requiredTier: WorkoutResourceTier) {
  if (requiredTier === "memorable") {
    return "Upgrade to Memorable";
  }

  return "Upgrade to Elite";
}

export function getWorkoutResourceUpgradeHref(requiredTier: WorkoutResourceTier) {
  if (requiredTier === "memorable") {
    return "/upgrade?reason=memorable-required";
  }

  return "/upgrade";
}

export function getWorkoutResourceLockMessage(
  requiredTier: WorkoutResourceTier,
  title: string,
) {
  if (requiredTier === "memorable") {
    return `${title} is available on Memorable and Elite memberships. Upgrade to Memorable to unlock this resource.`;
  }

  return `${title} is available on Elite memberships only. Upgrade to Elite to unlock this resource.`;
}
