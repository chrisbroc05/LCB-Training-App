import { validateProgramNote } from "@/lib/program-note-shared";

export const SUBMISSION_WHERE_OPTIONS = [
  "Tee",
  "Flips",
  "Machine",
  "Live BP",
  "Practice",
  "Game",
] as const;

export const SUBMISSION_LOOK_AT_HITTING = [
  "Load",
  "Timing",
  "Bat path",
  "Contact",
  "Finish",
  "Whole swing",
  "Not sure",
] as const;

export const SUBMISSION_LOOK_AT_FIELDING = [
  "Footwork",
  "Glove work",
  "Transfer",
  "Throw",
  "Whole play",
] as const;

export const SUBMISSION_VIDEO_CATEGORIES = ["HITTING", "FIELDING"] as const;

export type SubmissionWhereOption = (typeof SUBMISSION_WHERE_OPTIONS)[number];
export type SubmissionLookAtHittingOption = (typeof SUBMISSION_LOOK_AT_HITTING)[number];
export type SubmissionLookAtFieldingOption = (typeof SUBMISSION_LOOK_AT_FIELDING)[number];
export type SubmissionVideoCategory = (typeof SUBMISSION_VIDEO_CATEGORIES)[number];

export const SUBMISSION_NOTE_LABEL = "What do you want me to know?";
export const SUBMISSION_NOTE_PLACEHOLDER =
  "What felt off, what you're working on, or a question for me.";

export const SUBMISSION_WHERE_LABEL = "Where was this?";
export const SUBMISSION_LOOK_AT_LABEL = "What should I look at?";
export const SUBMISSION_VIDEO_CATEGORY_LABEL = "What kind of video is this?";

export const SUBMISSION_VIDEO_CATEGORY_OPTIONS: Array<{
  value: SubmissionVideoCategory;
  label: string;
}> = [
  { value: "HITTING", label: "Hitting" },
  { value: "FIELDING", label: "Fielding" },
];

export function getSubmissionLookAtOptions(category: SubmissionVideoCategory) {
  return category === "FIELDING" ? SUBMISSION_LOOK_AT_FIELDING : SUBMISSION_LOOK_AT_HITTING;
}

export function isSubmissionWhereOption(value: string): value is SubmissionWhereOption {
  return (SUBMISSION_WHERE_OPTIONS as readonly string[]).includes(value);
}

export function isSubmissionVideoCategory(value: string): value is SubmissionVideoCategory {
  return (SUBMISSION_VIDEO_CATEGORIES as readonly string[]).includes(value);
}

export function isSubmissionLookAtOption(
  value: string,
  category: SubmissionVideoCategory,
): value is SubmissionLookAtHittingOption | SubmissionLookAtFieldingOption {
  return (getSubmissionLookAtOptions(category) as readonly string[]).includes(value);
}

export function validateSubmissionWhere(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Pick where this video was taken." };
  }

  if (!isSubmissionWhereOption(trimmed)) {
    return { ok: false as const, error: "Invalid location selected." };
  }

  return { ok: true as const, value: trimmed };
}

export function validateSubmissionVideoCategory(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return { ok: false as const, error: "Pick hitting or fielding." };
  }

  if (!isSubmissionVideoCategory(trimmed)) {
    return { ok: false as const, error: "Invalid video category selected." };
  }

  return { ok: true as const, value: trimmed };
}

export function validateSubmissionLookAt(value: string, category: SubmissionVideoCategory) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Pick what you want Coach Broc to look at." };
  }

  if (!isSubmissionLookAtOption(trimmed, category)) {
    return { ok: false as const, error: "Invalid focus area selected." };
  }

  return { ok: true as const, value: trimmed };
}

export function validateSubmissionNote(value: string) {
  return validateProgramNote(value);
}

export function getSubmissionTypeLabelForEmail(params: {
  submissionTab: "swing" | "mental";
  videoCategory?: SubmissionVideoCategory | null;
}) {
  if (params.submissionTab === "mental") {
    return "mental game";
  }

  if (params.videoCategory === "FIELDING") {
    return "fielding";
  }

  return "swing analysis";
}
