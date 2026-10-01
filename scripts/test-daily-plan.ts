import { getDailyPlan } from "../lib/program-daily-plan";
import type { ProgramEnrollmentPlanInput } from "../lib/program-daily-plan";
import type { ProgramDailyPlanOverrides } from "../lib/program-plan-overrides";
import { resolveStrengthVariant } from "../lib/strength-variant-shared";
import { getProgramDay, parseProgramDateKey, type ProgramPhase } from "../lib/program-schedule";
import { getWorkout } from "../lib/workout-program-training";

function makeDayInfo(weekNumber: number, dayOfWeek: number) {
  const programDay = (weekNumber - 1) * 7 + dayOfWeek;
  return {
    programDay,
    weekNumber,
    dayOfWeek,
    phase: (weekNumber >= 9
      ? "COMPETE"
      : weekNumber >= 5
        ? "BUILD"
        : "FOUNDATION") as ProgramPhase,
    isBeforeStart: false,
    isComplete: false,
  };
}

function assertNoDuplicateMindsetPrompts() {
  const enrollment: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_12_15",
    focusAreas: ["mental"],
    equipment: ["nothing_special"],
    seasonMode: "OFF_SEASON",
  };

  for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
    const prompts: string[] = [];

    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek += 1) {
      const tasks = getDailyPlan(enrollment, makeDayInfo(weekNumber, dayOfWeek));
      for (const task of tasks) {
        if (task.type === "mindset" && task.mindsetPrompt) {
          prompts.push(task.mindsetPrompt);
        }
      }
    }

    const unique = new Set(prompts);
    if (unique.size !== prompts.length) {
      const duplicates = prompts.filter((prompt, index) => prompts.indexOf(prompt) !== index);
      throw new Error(
        `Week ${weekNumber} has duplicate mindset prompts: ${[...new Set(duplicates)].join(" | ")}`,
      );
    }
  }
}

function printScenario(
  label: string,
  enrollment: ProgramEnrollmentPlanInput,
  startKey: string,
  weeks: number[],
) {
  console.log(`\n=== ${label} ===`);

  for (const weekNumber of weeks) {
    console.log(`\n-- Week ${weekNumber} --`);
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
      const programDay = (weekNumber - 1) * 7 + dayOfWeek;
      getProgramDay(
        { startDate: parseProgramDateKey(startKey) },
        parseProgramDateKey(startKey),
      );

      const tasks = getDailyPlan(enrollment, makeDayInfo(weekNumber, dayOfWeek));
      console.log(`Day ${dayOfWeek} (program day ${programDay}):`);
      if (tasks.length === 0) {
        console.log("  Rest day");
        continue;
      }

      for (const task of tasks) {
        const drillTitles = task.drills?.map((drill) => drill.title).join(", ") ?? "";
        let strengthDetails = "";
        if (task.type === "strength" && task.workout) {
          const variant =
            task.workout.strengthVariant ??
            resolveStrengthVariant({
              strengthVariant: enrollment.strengthVariant,
              equipment: enrollment.equipment,
            });
          const workout = getWorkout(
            task.workout.category,
            task.workout.ageGroup,
            task.workout.week,
            task.workout.workoutId,
            variant,
          );
          strengthDetails = ` | strength: ${variant} | workout: ${workout?.title ?? "missing"}`;
        }
        console.log(
          `  - [${task.type}] ${task.title} | ${task.target}${task.focus ? ` | ${task.focus}` : ""}${drillTitles ? ` | drills: ${drillTitles}` : ""}${strengthDetails}`,
        );
      }
    }
  }
}

const scenarioA: ProgramEnrollmentPlanInput = {
  ageGroup: "AGE_12_15",
  focusAreas: ["hitting"],
  equipment: ["cage_field", "tee_net"],
  seasonMode: "OFF_SEASON",
};

const scenarioB: ProgramEnrollmentPlanInput = {
  ageGroup: "AGE_8_11",
  focusAreas: ["fielding", "mental"],
  equipment: ["nothing_special"],
  seasonMode: "OFF_SEASON",
};

const scenarioC: ProgramEnrollmentPlanInput = {
  ageGroup: "AGE_16_18",
  focusAreas: ["strength", "speed"],
  equipment: ["weights_gym"],
  seasonMode: "IN_SEASON",
};

const scenarioD: ProgramEnrollmentPlanInput = {
  ageGroup: "AGE_12_15",
  focusAreas: ["hitting"],
  equipment: ["nothing_special"],
  seasonMode: "OFF_SEASON",
};

const scenarioE: ProgramEnrollmentPlanInput = {
  ageGroup: "AGE_16_18",
  focusAreas: ["strength", "speed"],
  equipment: ["home_weights"],
  strengthVariant: "home_weights",
  seasonMode: "OFF_SEASON",
};

assertNoDuplicateMindsetPrompts();
console.log("Mindset prompt uniqueness check passed for all 12 weeks.");

printScenario("(a) 12-15, hitting focus, cage_field + tee_net, off season", scenarioA, "2026-01-05", [
  1,
  6,
  10,
]);
printScenario("(b) 8-11, fielding + mental, nothing_special, off season", scenarioB, "2026-01-05", [
  1,
  6,
  10,
]);
printScenario("(c) 16-18, strength + speed, weights_gym, in season", scenarioC, "2026-01-05", [
  1,
  6,
  10,
]);
printScenario("(d) 12-15, hitting focus, nothing_special (bodyweight strength)", scenarioD, "2026-01-05", [
  1,
  6,
  10,
]);
printScenario("(e) 16-18, strength + speed, home_weights, off season", scenarioE, "2026-01-05", [
  1,
  6,
  10,
]);

function assertFocusOverrideCase() {
  const enrollment: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_12_15",
    focusAreas: ["hitting"],
    equipment: ["cage_field"],
    seasonMode: "OFF_SEASON",
  };
  const dayInfo = makeDayInfo(3, 2);
  const overrides: ProgramDailyPlanOverrides = {
    focusOverride: {
      cueLabel: "Stay on the back side",
      drillIds: ["1207514238", "1200422500"],
      note: "Keep the load centered this week.",
    },
  };

  const tasks = getDailyPlan(enrollment, dayInfo, overrides);
  const hittingTasks = tasks.filter((task) => task.type === "hitting");

  if (hittingTasks.length === 0) {
    throw new Error("Expected at least one hitting task for focus override test.");
  }

  for (const task of hittingTasks) {
    if (task.focus !== "Focus: Stay on the back side") {
      throw new Error(`Expected override focus on hitting task, got: ${task.focus}`);
    }
    if (!task.drills || task.drills.length === 0) {
      throw new Error("Expected override drills on hitting task.");
    }
  }

  console.log("Focus override test passed.");
}

function assertCustomTaskReplaceCase() {
  const enrollment: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_12_15",
    focusAreas: ["hitting"],
    equipment: ["cage_field"],
    seasonMode: "OFF_SEASON",
  };
  const dayInfo = makeDayInfo(2, 1);
  const baseTasks = getDailyPlan(enrollment, dayInfo);
  const replacedKey = baseTasks[0]?.key;

  if (!replacedKey) {
    throw new Error("Expected a base task to replace.");
  }

  const overrides: ProgramDailyPlanOverrides = {
    customTasks: [
      {
        id: "coach-task-1",
        programDay: dayInfo.programDay,
        title: "Coach tee drill",
        target: "3 rounds of 10",
        details: "Stay stacked through contact.",
        drillIds: ["1207514238"],
        replacesTaskKey: replacedKey,
      },
    ],
  };

  const tasks = getDailyPlan(enrollment, dayInfo, overrides);

  if (tasks.some((task) => task.key === replacedKey)) {
    throw new Error("Replaced task should have been removed from the daily plan.");
  }

  const customTask = tasks.find((task) => task.key === `d${dayInfo.programDay}-custom-coach-task-1`);
  if (!customTask) {
    throw new Error("Expected coach custom task in daily plan.");
  }

  if (!customTask.isCoachAdded) {
    throw new Error("Custom task should be marked as coach-added.");
  }

  console.log("Custom replace test passed.");
}

assertFocusOverrideCase();
assertCustomTaskReplaceCase();

console.log("\nDaily plan self-tests completed.");
