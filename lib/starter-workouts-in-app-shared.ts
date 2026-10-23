import type { WorkoutAgeGroup, WorkoutCategory } from "@/lib/workout-program-types";

export type StarterWorkoutProgramKey = "strength" | "speed_agility" | "mobility";

export type StarterWorkoutProgram = {
  key: StarterWorkoutProgramKey;
  title: string;
  description: string;
  category: WorkoutCategory;
  maxWeek: 4;
};

export const STARTER_WORKOUT_PROGRAMS: StarterWorkoutProgram[] = [
  {
    key: "strength",
    title: "4-Week Strength Starter",
    description: "Foundation strength work by age group. Weeks 1-4 in the app (no PDF download on Core).",
    category: "strength",
    maxWeek: 4,
  },
  {
    key: "speed_agility",
    title: "4-Week Speed and Agility Starter",
    description: "Speed and agility basics by age group. Weeks 1-4 in the app.",
    category: "speed_agility",
    maxWeek: 4,
  },
  {
    key: "mobility",
    title: "4-Week Mobility Starter",
    description: "Mobility and recovery work by age group. Weeks 1-4 in the app.",
    category: "mobility",
    maxWeek: 4,
  },
];

export const STARTER_WORKOUT_AGE_GROUPS: { key: WorkoutAgeGroup; label: string }[] = [
  { key: "8-11", label: "Ages 8-11" },
  { key: "12-15", label: "Ages 12-15" },
  { key: "16-18", label: "Ages 16+" },
];

export function getStarterWorkoutProgram(key: string) {
  return STARTER_WORKOUT_PROGRAMS.find((program) => program.key === key);
}
