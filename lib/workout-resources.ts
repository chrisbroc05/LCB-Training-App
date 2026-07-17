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
        title: "Nutrition and Fueling Guide",
        description: "Fuel and recovery guidance built for baseball athletes.",
        requiredTier: "basic",
      },
      {
        filename: "LCB_Mental_Game_Workbook.pdf",
        title: "Mental Game Workbook",
        description: "Exercises and prompts to strengthen confidence, focus, and composure.",
        requiredTier: "basic",
      },
      {
        filename: "LCB_Parent_Guide.pdf",
        title: "Parent Guide",
        description: "Support strategies for parents helping athletes grow on and off the field.",
        requiredTier: "basic",
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
  if (requiredTier === "basic") {
    return "Upgrade to Basic";
  }

  return "Upgrade to Elite";
}

export function getWorkoutResourceUpgradeHref(requiredTier: WorkoutResourceTier) {
  if (requiredTier === "basic") {
    return "/upgrade?reason=basic-required";
  }

  return "/upgrade";
}

export function getWorkoutResourceLockMessage(
  requiredTier: WorkoutResourceTier,
  title: string,
) {
  if (requiredTier === "basic") {
    return `${title} is available on Basic and above. Upgrade to Basic to unlock this resource.`;
  }

  return `${title} is available on Elite memberships only. Upgrade to Elite to unlock this resource.`;
}
