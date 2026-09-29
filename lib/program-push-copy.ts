import type { ProgramTaskType } from "@/lib/program-daily-plan";

export const DAILY_WORK_PUSH_TITLE = "Today's work is ready";

export const GONE_QUIET_PUSH_TITLE = "Haven't seen you in a few days";

type PushCategoryKey = "hitting" | "fielding" | "workout" | "mindset" | "weekly-video";

const PUSH_CATEGORY_LABELS: Record<PushCategoryKey, string> = {
  hitting: "hitting",
  fielding: "fielding",
  workout: "a workout",
  mindset: "mindset",
  "weekly-video": "your weekly video",
};

export type PushCopyTask = {
  type: string;
  isCoachAdded?: boolean;
};

function capitalizeFirst(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function getPushCategoryKeyFromTaskType(type: string): PushCategoryKey | null {
  switch (type as ProgramTaskType) {
    case "hitting":
      return "hitting";
    case "fielding":
      return "fielding";
    case "strength":
    case "speed":
    case "mobility":
    case "sprint":
    case "core":
      return "workout";
    case "mindset":
    case "playbook":
    case "reflection":
      return "mindset";
    default:
      return null;
  }
}

export function collectPushCategoryLabels(tasks: PushCopyTask[], includeWeeklyVideo: boolean) {
  const labels: string[] = [];
  const seen = new Set<PushCategoryKey>();

  for (const task of tasks) {
    const key = getPushCategoryKeyFromTaskType(task.type);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    labels.push(PUSH_CATEGORY_LABELS[key]);
  }

  if (includeWeeklyVideo && !seen.has("weekly-video")) {
    labels.push(PUSH_CATEGORY_LABELS["weekly-video"]);
  }

  return labels;
}

export function hasCoachAddedTaskForPush(tasks: PushCopyTask[]) {
  return tasks.some((task) => task.isCoachAdded || task.type === "custom");
}

export function formatPushCategoryList(labels: string[]) {
  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return capitalizeFirst(labels[0]);
  }

  if (labels.length === 2) {
    return `${capitalizeFirst(labels[0])} and ${labels[1]}`;
  }

  const head = capitalizeFirst(labels[0]);
  const middle = labels.slice(1, -1).join(", ");
  const last = labels[labels.length - 1];
  return `${head}, ${middle} and ${last}`;
}

export function buildDailyWorkPushBody(params: {
  tasks: PushCopyTask[];
  includeWeeklyVideo: boolean;
}) {
  const labels = collectPushCategoryLabels(params.tasks, params.includeWeeklyVideo);
  const coachPrefix = hasCoachAddedTaskForPush(params.tasks)
    ? "Coach Broc added something. "
    : "";

  if (labels.length === 0) {
    return `${coachPrefix}Let's go.`;
  }

  const list = formatPushCategoryList(labels);
  if (labels.length === 1) {
    return `${coachPrefix}${list} today. Let's go.`;
  }

  return `${coachPrefix}${list} today.`;
}

export function buildGoneQuietPushBody(params: {
  tasks: PushCopyTask[];
  includeWeeklyVideo: boolean;
}) {
  const labels = collectPushCategoryLabels(params.tasks, params.includeWeeklyVideo);

  if (labels.length === 0) {
    return `${GONE_QUIET_PUSH_TITLE}. Get one thing done today.`;
  }

  const list = formatPushCategoryList(labels);
  const verb = labels.length === 1 ? "is" : "are";
  return `${GONE_QUIET_PUSH_TITLE}. ${list} ${verb} waiting. Get one thing done today.`;
}

export function shouldSkipDailyWorkPushForGoneQuiet(willSendGoneQuietPush: boolean) {
  return willSendGoneQuietPush;
}

export function runProgramPushCopySelfTests() {
  const hittingFieldingWorkout = [
    { type: "hitting" },
    { type: "fielding" },
    { type: "strength" },
  ];

  if (buildDailyWorkPushBody({ tasks: [{ type: "hitting" }], includeWeeklyVideo: false }) !== "Hitting today. Let's go.") {
    throw new Error("daily work 1 task body mismatch");
  }

  if (
    buildDailyWorkPushBody({
      tasks: [{ type: "hitting" }, { type: "fielding" }],
      includeWeeklyVideo: false,
    }) !== "Hitting and fielding today."
  ) {
    throw new Error("daily work 2 task body mismatch");
  }

  if (buildDailyWorkPushBody({ tasks: hittingFieldingWorkout, includeWeeklyVideo: false }) !== "Hitting, fielding and a workout today.") {
    throw new Error("daily work 3 task body mismatch");
  }

  if (
    buildDailyWorkPushBody({
      tasks: [{ type: "custom", isCoachAdded: true }, { type: "hitting" }],
      includeWeeklyVideo: false,
    }) !== "Coach Broc added something. Hitting today. Let's go."
  ) {
    throw new Error("daily work coach-added prefix mismatch");
  }

  if (
    buildGoneQuietPushBody({
      tasks: [{ type: "hitting" }, { type: "fielding" }],
      includeWeeklyVideo: false,
    }) !== "Haven't seen you in a few days. Hitting and fielding are waiting. Get one thing done today."
  ) {
    throw new Error("gone quiet body mismatch");
  }

  if (
    collectPushCategoryLabels(
      [{ type: "strength" }, { type: "speed" }, { type: "mindset" }, { type: "playbook" }],
      true,
    ).join("|") !== "a workout|mindset|your weekly video"
  ) {
    throw new Error("category dedupe mismatch");
  }

  if (!shouldSkipDailyWorkPushForGoneQuiet(true)) {
    throw new Error("daily work should skip when gone quiet will send");
  }

  if (shouldSkipDailyWorkPushForGoneQuiet(false)) {
    throw new Error("daily work should not skip when gone quiet will not send");
  }

  return 8;
}
