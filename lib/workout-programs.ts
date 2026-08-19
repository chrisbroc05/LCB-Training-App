import { getWorkoutPdfUrl } from "@/lib/workouts";

export type AgeGroupKey = "8-11" | "12-15" | "16-18";

export type ProgramDownload = {
  label: string;
  href: string;
};

export type WorkoutProgramCard = {
  title: string;
  description: string;
  downloads: ProgramDownload[];
  layout: "phases" | "single";
  singleActionLabel?: string;
};

type PhaseNumber = 1 | 2 | 3;

type ProgramCategory = "strength" | "speed";

const phaseLabels: Record<PhaseNumber, string> = {
  1: "Phase 1",
  2: "Phase 2",
  3: "Phase 3",
};

export const RESOURCES_AGE_GROUP_STORAGE_KEY = "lcb-resources-age-group";

export const ageGroupOptions: { key: AgeGroupKey; label: string }[] = [
  { key: "8-11", label: "Ages 8-11" },
  { key: "12-15", label: "Ages 12-15" },
  { key: "16-18", label: "Ages 16-18" },
];

export const ageGroupDetails: Record<
  AgeGroupKey,
  {
    header: string;
    description: string;
  }
> = {
  "8-11": {
    header: "Ages 8-11 Programs",
    description: "Foundation programs focused on movement, coordination, and fun.",
  },
  "12-15": {
    header: "Ages 12-15 Programs",
    description: "Progressive programs building real athletic strength and speed.",
  },
  "16-18": {
    header: "Ages 16-18 Programs",
    description: "Advanced programs designed to get you ready for the next level.",
  },
};

const rotationalPowerProgram: WorkoutProgramCard = {
  title: "Rotational Power Program",
  description:
    "Rotational power work with PVC pipe mechanics, med ball circuits, and a full exercise glossary.",
  layout: "single",
  singleActionLabel: "Download",
  downloads: [
    {
      label: "Download",
      href: "/LCB_Rotational_Sample.pdf",
    },
  ],
};

function buildPhaseDownloads(ageKey: AgeGroupKey, category: ProgramCategory) {
  return ([1, 2, 3] as PhaseNumber[]).map((phase) => ({
    label: phaseLabels[phase],
    href: getWorkoutPdfUrl(
      category === "strength"
        ? `LCB_Strength_${ageKey}_Phase${phase}.pdf`
        : `LCB_Speed-Agility_${ageKey}_Phase${phase}.pdf`,
    ),
  }));
}

function buildStrengthProgram(ageKey: AgeGroupKey): WorkoutProgramCard {
  return {
    title: "Strength Program",
    description: "Build athletic strength across a progressive 12-week training block.",
    layout: "phases",
    downloads: buildPhaseDownloads(ageKey, "strength"),
  };
}

function buildSpeedProgram(ageKey: AgeGroupKey): WorkoutProgramCard {
  return {
    title: "Speed and Agility Program",
    description: "Develop first-step quickness, agility, and game-speed movement.",
    layout: "phases",
    downloads: buildPhaseDownloads(ageKey, "speed"),
  };
}

const mobilityDescriptions: Record<AgeGroupKey, string> = {
  "8-11": "Flexibility and joint range work for safer athletic movement.",
  "12-15": "Targeted mobility work to improve movement quality and recovery.",
  "16-18": "Hip, shoulder, and spine mobility to support high-level performance.",
};

function buildMobilityProgram(ageKey: AgeGroupKey): WorkoutProgramCard {
  return {
    title: "Mobility Program",
    description: mobilityDescriptions[ageKey],
    layout: "single",
    singleActionLabel: "Download",
    downloads: [
      {
        label: "Download",
        href: getWorkoutPdfUrl(`LCB_Mobility_${ageKey}.pdf`),
      },
    ],
  };
}

export function getProgramsForAgeGroup(ageKey: AgeGroupKey): WorkoutProgramCard[] {
  return [
    buildStrengthProgram(ageKey),
    buildSpeedProgram(ageKey),
    buildMobilityProgram(ageKey),
    rotationalPowerProgram,
  ];
}

export function isAgeGroupKey(value: string | null | undefined): value is AgeGroupKey {
  return value === "8-11" || value === "12-15" || value === "16-18";
}
