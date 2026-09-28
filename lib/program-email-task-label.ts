import type { ProgramTaskType } from "@/lib/program-daily-plan";

export function getTaskCategoryLabel(type: string) {
  switch (type as ProgramTaskType) {
    case "hitting":
      return "HITTING";
    case "fielding":
      return "FIELDING";
    case "strength":
    case "core":
      return "STRENGTH";
    case "speed":
    case "sprint":
      return "SPEED";
    case "mobility":
      return "MOBILITY";
    case "reflection":
      return "REFLECTION";
    case "custom":
      return "COACH";
    case "playbook":
      return "MINDSET";
    default:
      return "MINDSET";
  }
}

export function formatTaskLineForEmail(task: {
  type: string;
  title: string;
  target: string;
  focus?: string;
}) {
  const category = getTaskCategoryLabel(task.type);
  const focusSuffix = task.focus ? ` - Focus: ${task.focus}` : "";
  return `${category} - ${task.title} - ${task.target}${focusSuffix}`;
}
