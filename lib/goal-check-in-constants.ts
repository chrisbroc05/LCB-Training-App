export const GOAL_FOCUS_AREAS = [
  "hitting",
  "fielding",
  "speed",
  "strength",
  "mental game",
] as const;

export type GoalFocusArea = (typeof GOAL_FOCUS_AREAS)[number];

export const GOAL_ITEM_CATEGORIES = [
  {
    value: "hitting",
    label: "Hitting",
    badgeClassName: "border-red-500/40 bg-red-500/15 text-red-200",
  },
  {
    value: "fielding",
    label: "Fielding",
    badgeClassName: "border-blue-500/40 bg-blue-500/15 text-blue-200",
  },
  {
    value: "strength_and_conditioning",
    label: "Strength and Conditioning",
    badgeClassName: "border-purple-500/40 bg-purple-500/15 text-purple-200",
  },
  {
    value: "speed_and_agility",
    label: "Speed and Agility",
    badgeClassName: "border-yellow-500/40 bg-yellow-500/15 text-yellow-200",
  },
  {
    value: "mental_game",
    label: "Mental Game",
    badgeClassName: "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#9df3bd]",
  },
] as const;

export type GoalItemCategory = (typeof GOAL_ITEM_CATEGORIES)[number]["value"];

export const MAX_GOAL_ITEMS = 5;

export function isGoalFocusArea(value: string): value is GoalFocusArea {
  return GOAL_FOCUS_AREAS.includes(value as GoalFocusArea);
}

export function isGoalItemCategory(value: string): value is GoalItemCategory {
  return GOAL_ITEM_CATEGORIES.some((category) => category.value === value);
}

export function getGoalItemCategoryMeta(category: string) {
  const match = GOAL_ITEM_CATEGORIES.find((entry) => entry.value === category);
  if (match) {
    return match;
  }

  return {
    value: category,
    label: category,
    badgeClassName: "border-[#2b3650] bg-black/30 text-zinc-200",
  };
}

export function getCurrentMonthBoundsUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function isWithinCurrentMonthUtc(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const { start, end } = getCurrentMonthBoundsUtc();
  return date >= start && date < end;
}

export function formatGoalFocusAreaLabel(focusArea: string) {
  if (focusArea === "mental game") {
    return "Mental Game";
  }

  return focusArea.charAt(0).toUpperCase() + focusArea.slice(1);
}

export type SerializedGoalItem = {
  id: number;
  category: string;
  categoryLabel: string;
  badgeClassName: string;
  description: string;
  targetValue: string | null;
  completed: boolean;
  completedAt: string | null;
};

export function serializeGoalItem(goal: {
  id: number;
  category: string;
  description: string;
  targetValue: string | null;
  completed: boolean;
  completedAt: Date | null;
}): SerializedGoalItem {
  const categoryMeta = getGoalItemCategoryMeta(goal.category);

  return {
    id: goal.id,
    category: goal.category,
    categoryLabel: categoryMeta.label,
    badgeClassName: categoryMeta.badgeClassName,
    description: goal.description,
    targetValue: goal.targetValue,
    completed: goal.completed,
    completedAt: goal.completedAt?.toISOString() ?? null,
  };
}
