export type WorkoutCategory = "strength" | "speed_agility" | "mobility";

export type WorkoutAgeGroup = "8-11" | "12-15" | "16-18";

export type WorkoutPhase = "foundation" | "build" | "compete";

export type WorkoutId = "A" | "B";

export type WorkoutExercise = {
  name: string;
  sets?: string;
  repsOrTime: string;
  rest: string;
  formCue?: string;
};

export type WorkoutSection = {
  name: string;
  rounds?: number;
  rest?: string;
  exercises: WorkoutExercise[];
};

export type StructuredWorkout = {
  id: WorkoutId;
  title: string;
  sections: WorkoutSection[];
  coachNote?: string;
};

export type WorkoutWeek = {
  weekNumber: number;
  phase: WorkoutPhase;
  workouts: Partial<Record<WorkoutId, StructuredWorkout>>;
};

export type WorkoutProgram = {
  category: WorkoutCategory;
  ageGroup: WorkoutAgeGroup;
  phases: WorkoutPhase[];
  glossary: Record<string, string>;
  weeks: WorkoutWeek[];
};

export type WorkoutWithCues = StructuredWorkout & {
  weekNumber: number;
  phase: WorkoutPhase;
  category: WorkoutCategory;
  ageGroup: WorkoutAgeGroup;
};
