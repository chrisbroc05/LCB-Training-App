import {
  getDailyPlan,
  getRequiredTaskKeysForDay,
  getTaskKeysForDay,
  type ProgramEnrollmentPlanInput,
} from "../lib/program-daily-plan";
import { deriveStrengthVariantFromEquipment } from "../lib/strength-variant-shared";
import type { ProgramPhase } from "../lib/program-schedule";

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

function assertExtraScope() {
  const gym1215: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_12_15",
    focusAreas: ["hitting"],
    equipment: ["weights_gym"],
    seasonMode: "OFF_SEASON",
    strengthVariant: "gym",
  };

  const tuesday = makeDayInfo(1, 2);
  const tuesdayTasks = getDailyPlan(gym1215, tuesday);
  const extraA = tuesdayTasks.find((task) => task.key.endsWith("-strength-extra-a"));
  if (!extraA || extraA.type !== "strength_extra" || !extraA.optional) {
    throw new Error("12-15 gym Tuesday should include optional extra after strength A.");
  }
  if (extraA.trackExercises?.length !== 3) {
    throw new Error("12-15 gym strength A extra should have 3 exercises.");
  }

  const friday = makeDayInfo(1, 5);
  const fridayTasks = getDailyPlan(gym1215, friday);
  if (!fridayTasks.some((task) => task.key.endsWith("-strength-extra-b"))) {
    throw new Error("12-15 gym Friday should include optional extra after strength B.");
  }

  const homeBw: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_16_18",
    focusAreas: ["hitting"],
    equipment: ["nothing_special"],
    seasonMode: "OFF_SEASON",
    strengthVariant: "bodyweight",
  };

  const homeTuesday = getDailyPlan(homeBw, tuesday);
  if (homeTuesday.some((task) => task.type === "strength_extra")) {
    throw new Error("Home bodyweight should not include extra on strength A.");
  }

  const homeFriday = getDailyPlan(homeBw, friday);
  const homeExtraB = homeFriday.find((task) => task.key.endsWith("-strength-extra-b"));
  if (!homeExtraB) {
    throw new Error("16-18 bodyweight Friday should include optional extra on strength B.");
  }

  const child811: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_8_11",
    focusAreas: ["hitting"],
    equipment: ["nothing_special"],
    seasonMode: "OFF_SEASON",
    strengthVariant: "bodyweight",
  };

  const childFriday = getDailyPlan(child811, friday);
  if (childFriday.some((task) => task.type === "strength_extra")) {
    throw new Error("8-11 should never get strength extra tasks.");
  }
}

function assertRequiredKeysExcludeOptional() {
  const enrollment: ProgramEnrollmentPlanInput = {
    ageGroup: "AGE_12_15",
    focusAreas: ["hitting"],
    equipment: ["weights_gym"],
    seasonMode: "OFF_SEASON",
    strengthVariant: "gym",
  };
  const dayInfo = makeDayInfo(1, 5);
  const all = getDailyPlan(enrollment, dayInfo);
  const required = getRequiredTaskKeysForDay(enrollment, dayInfo);
  const optionalKeys = all.filter((task) => task.optional).map((task) => task.key);

  for (const key of optionalKeys) {
    if (required.includes(key)) {
      throw new Error(`Optional task ${key} must not be in required keys.`);
    }
  }

  if (getTaskKeysForDay(enrollment, dayInfo).some((key) => optionalKeys.includes(key))) {
    throw new Error("getTaskKeysForDay must match required keys only.");
  }
}

function assert811VariantDerivation() {
  const variant = deriveStrengthVariantFromEquipment(["nothing_special"], "AGE_8_11");
  if (variant !== "gym") {
    throw new Error("8-11 should always resolve to gym strength variant.");
  }
}

assertExtraScope();
assertRequiredKeysExcludeOptional();
assert811VariantDerivation();

console.log("Strength extra work tests passed.");
