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
};

export type AgeGroupPrograms = {
  key: AgeGroupKey;
  label: string;
  programs: WorkoutProgramCard[];
};

type PhaseNumber = 1 | 2 | 3;

type ProgramCategory = "strength" | "speed";

const strengthPhaseDescriptions: Record<PhaseNumber, string> = {
  1: "Foundation movement patterns, bodyweight strength, and coordination.",
  2: "Progressive resistance training with light external load.",
  3: "Higher intensity strength training with compound movements and power development.",
};

const speedPhaseDescriptions: Record<PhaseNumber, string> = {
  1: "Basic acceleration, deceleration, and change of direction.",
  2: "Intermediate speed mechanics and multi-directional agility.",
  3: "Advanced sprint mechanics, explosive first step, and game-speed agility.",
};

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

const rotationalPowerProgram: WorkoutProgramCard = {
  title: "Rotational Power Program",
  description:
    "Rotational workouts with PVC pipe mechanics, med ball circuits, and a full exercise glossary for bat speed and throwing power.",
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
    description: `12-week strength track in three phases. ${strengthPhaseDescriptions[1]} ${strengthPhaseDescriptions[2]} ${strengthPhaseDescriptions[3]}`,
    downloads: buildPhaseDownloads(ageKey, "strength"),
  };
}

function buildSpeedProgram(ageKey: AgeGroupKey): WorkoutProgramCard {
  return {
    title: "Speed and Agility Program",
    description: `12-week speed and agility track in three phases. ${speedPhaseDescriptions[1]} ${speedPhaseDescriptions[2]} ${speedPhaseDescriptions[3]}`,
    downloads: buildPhaseDownloads(ageKey, "speed"),
  };
}

const mobilityDescriptions: Record<AgeGroupKey, string> = {
  "8-11": "Increase flexibility and joint range for safer athletic movement.",
  "12-15": "Improve movement quality and recovery through targeted mobility work.",
  "16-18": "Maintain hip, shoulder, and spine mobility to support performance.",
};

function buildMobilityProgram(ageKey: AgeGroupKey): WorkoutProgramCard {
  return {
    title: "Mobility Program",
    description: mobilityDescriptions[ageKey],
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
