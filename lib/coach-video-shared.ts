export const COACH_VIDEO_TITLE_MIN_LENGTH = 3;
export const COACH_VIDEO_TITLE_MAX_LENGTH = 80;
export const COACH_VIDEO_NOTE_MAX_LENGTH = 1000;

export type CoachVideoDrillCategoryValue = "HITTING" | "FIELDING" | "MINDSET" | "OTHER";

export const COACH_VIDEO_DRILL_CATEGORY_OPTIONS: Array<{
  value: CoachVideoDrillCategoryValue;
  label: string;
}> = [
  { value: "HITTING", label: "Hitting" },
  { value: "FIELDING", label: "Fielding" },
  { value: "MINDSET", label: "Mindset" },
  { value: "OTHER", label: "Other" },
];

export type CoachVideoListItem = {
  id: string;
  source: "coach_video" | "submission_response";
  title: string;
  note: string | null;
  createdAt: string;
  viewedAt: string | null;
  videoKey: string;
  drillCategory: CoachVideoDrillCategoryValue | null;
  submissionType: "SWING" | "MENTAL" | null;
  submissionId: string | null;
};

export type AdminCoachVideoSummary = {
  id: string;
  title: string;
  createdAt: string;
  viewedAt: string | null;
  drillCategory: CoachVideoDrillCategoryValue | null;
};

export function formatCoachVideoDrillCategoryLabel(
  category: CoachVideoDrillCategoryValue | null | undefined,
) {
  if (!category) {
    return null;
  }

  return COACH_VIDEO_DRILL_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? null;
}

export function validateCoachVideoTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed.length < COACH_VIDEO_TITLE_MIN_LENGTH) {
    return `Title must be at least ${COACH_VIDEO_TITLE_MIN_LENGTH} characters.`;
  }

  if (trimmed.length > COACH_VIDEO_TITLE_MAX_LENGTH) {
    return `Title must be ${COACH_VIDEO_TITLE_MAX_LENGTH} characters or less.`;
  }

  return null;
}

export function validateCoachVideoNote(note: string) {
  if (note.trim().length > COACH_VIDEO_NOTE_MAX_LENGTH) {
    return `Note must be ${COACH_VIDEO_NOTE_MAX_LENGTH} characters or less.`;
  }

  return null;
}

export function parseCoachVideoDrillCategory(
  value: string | null | undefined,
): CoachVideoDrillCategoryValue | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (
    normalized === "HITTING" ||
    normalized === "FIELDING" ||
    normalized === "MINDSET" ||
    normalized === "OTHER"
  ) {
    return normalized;
  }

  return null;
}

export function buildCoachVideoMessageBody(title: string, coachVideoId: string) {
  return `Sent you a video: ${title.trim()}\n/videos/${coachVideoId}`;
}

export function parseCoachVideoLinkFromMessage(body: string) {
  const match = body.match(/\/videos\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}
