/** Drill library category filters (matches Train tab). */

export const DRILL_LIBRARY_CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
] as const;

export type DrillLibraryCategoryFilterKey =
  (typeof DRILL_LIBRARY_CATEGORY_FILTERS)[number]["key"];
