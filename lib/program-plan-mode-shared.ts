export const PROGRAM_PLAN_MODES = ["FIXED_12_WEEK", "OPEN_ENDED"] as const;

export type ProgramPlanMode = (typeof PROGRAM_PLAN_MODES)[number];

export function isProgramPlanMode(value: string): value is ProgramPlanMode {
  return (PROGRAM_PLAN_MODES as readonly string[]).includes(value);
}

export function defaultProgramPlanMode(): ProgramPlanMode {
  return "FIXED_12_WEEK";
}
