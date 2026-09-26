import { getDailyPlan } from "../lib/program-daily-plan";
import { getProgramDay, parseProgramDateKey, type ProgramPhase } from "../lib/program-schedule";
import type { ProgramEnrollmentPlanInput } from "../lib/program-daily-plan";

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
        console.log(
          `  - [${task.type}] ${task.title} | ${task.target}${task.focus ? ` | ${task.focus}` : ""}${drillTitles ? ` | drills: ${drillTitles}` : ""}`,
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

console.log("\nDaily plan self-tests completed.");
