/**
 * Recruiting help form options and plain-text helpers (client-safe).
 */

import { getGraduationYearOptions, PLAYER_POSITIONS } from "@/lib/player-profile";

export const RECRUITING_LEVELS = [
  "D1",
  "D2",
  "D3",
  "NAIA",
  "JUCO",
  "Not sure",
] as const;

export const RECRUITING_LOCATIONS = [
  { value: "CLOSE_TO_HOME", label: "Close to home (within ~3 hours)" },
  { value: "MIDWEST", label: "Midwest" },
  { value: "ANYWHERE", label: "Anywhere" },
] as const;

export const RECRUITING_SCHOOL_SIZES = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "NO_PREFERENCE", label: "No preference" },
] as const;

export const RECRUITING_GPA_RANGES = [
  "Under 2.5",
  "2.5-2.9",
  "3.0-3.4",
  "3.5-3.9",
  "4.0+",
  "Prefer not to say",
] as const;

export const RECRUITING_SCHOLARSHIP_IMPORTANCE = [
  { value: "VERY", label: "Very" },
  { value: "SOMEWHAT", label: "Somewhat" },
  { value: "NOT_A_FACTOR", label: "Not a factor" },
] as const;

export const RECRUITING_POSITIONS = PLAYER_POSITIONS;

export type RecruitingLevel = (typeof RECRUITING_LEVELS)[number];
export type RecruitingLocation = (typeof RECRUITING_LOCATIONS)[number]["value"];
export type RecruitingSchoolSize = (typeof RECRUITING_SCHOOL_SIZES)[number]["value"];
export type RecruitingGpaRange = (typeof RECRUITING_GPA_RANGES)[number];
export type RecruitingScholarshipImportance =
  (typeof RECRUITING_SCHOLARSHIP_IMPORTANCE)[number]["value"];

export type RecruitingAnswersInput = {
  gradYear: number | null;
  primaryPosition: string | null;
  secondaryPosition: string | null;
  levelsOpenTo: string[];
  locationPreference: string | null;
  schoolSize: string | null;
  majorOrStudy: string | null;
  gpaRange: string | null;
  scholarshipImportance: string | null;
  videoUrl: string | null;
  notesForCoach: string | null;
};

export type RecruitingProfileView = RecruitingAnswersInput & {
  enabled: boolean;
  coachSchoolList: string | null;
  answersUpdatedAt: string | null;
  schoolListUpdatedAt: string | null;
};

export function getRecruitingGraduationYearOptions(referenceDate = new Date()) {
  return getGraduationYearOptions(referenceDate);
}

export function isRecruitingLevel(value: string): value is RecruitingLevel {
  return (RECRUITING_LEVELS as readonly string[]).includes(value);
}

export function isRecruitingLocation(value: string): value is RecruitingLocation {
  return RECRUITING_LOCATIONS.some((item) => item.value === value);
}

export function isRecruitingSchoolSize(value: string): value is RecruitingSchoolSize {
  return RECRUITING_SCHOOL_SIZES.some((item) => item.value === value);
}

export function isRecruitingGpaRange(value: string): value is RecruitingGpaRange {
  return (RECRUITING_GPA_RANGES as readonly string[]).includes(value);
}

export function isRecruitingScholarshipImportance(
  value: string,
): value is RecruitingScholarshipImportance {
  return RECRUITING_SCHOLARSHIP_IMPORTANCE.some((item) => item.value === value);
}

export function isRecruitingPosition(value: string) {
  return (RECRUITING_POSITIONS as readonly string[]).includes(value);
}

export function labelForRecruitingLocation(value: string | null | undefined) {
  return RECRUITING_LOCATIONS.find((item) => item.value === value)?.label ?? value ?? "";
}

export function labelForRecruitingSchoolSize(value: string | null | undefined) {
  return RECRUITING_SCHOOL_SIZES.find((item) => item.value === value)?.label ?? value ?? "";
}

export function labelForRecruitingScholarship(value: string | null | undefined) {
  return (
    RECRUITING_SCHOLARSHIP_IMPORTANCE.find((item) => item.value === value)?.label ?? value ?? ""
  );
}

export function emptyRecruitingAnswers(): RecruitingAnswersInput {
  return {
    gradYear: null,
    primaryPosition: null,
    secondaryPosition: null,
    levelsOpenTo: [],
    locationPreference: null,
    schoolSize: null,
    majorOrStudy: null,
    gpaRange: null,
    scholarshipImportance: null,
    videoUrl: null,
    notesForCoach: null,
  };
}

export function serializeRecruitingProfile(profile: {
  enabled: boolean;
  gradYear: number | null;
  primaryPosition: string | null;
  secondaryPosition: string | null;
  levelsOpenTo: string[];
  locationPreference: string | null;
  schoolSize: string | null;
  majorOrStudy: string | null;
  gpaRange: string | null;
  scholarshipImportance: string | null;
  videoUrl: string | null;
  notesForCoach: string | null;
  coachSchoolList: string | null;
  answersUpdatedAt: Date | null;
  schoolListUpdatedAt: Date | null;
} | null): RecruitingProfileView {
  if (!profile) {
    return {
      enabled: false,
      ...emptyRecruitingAnswers(),
      coachSchoolList: null,
      answersUpdatedAt: null,
      schoolListUpdatedAt: null,
    };
  }

  return {
    enabled: profile.enabled,
    gradYear: profile.gradYear,
    primaryPosition: profile.primaryPosition,
    secondaryPosition: profile.secondaryPosition,
    levelsOpenTo: profile.levelsOpenTo.slice(),
    locationPreference: profile.locationPreference,
    schoolSize: profile.schoolSize,
    majorOrStudy: profile.majorOrStudy,
    gpaRange: profile.gpaRange,
    scholarshipImportance: profile.scholarshipImportance,
    videoUrl: profile.videoUrl,
    notesForCoach: profile.notesForCoach,
    coachSchoolList: profile.coachSchoolList,
    answersUpdatedAt: profile.answersUpdatedAt?.toISOString() ?? null,
    schoolListUpdatedAt: profile.schoolListUpdatedAt?.toISOString() ?? null,
  };
}

export function isRecruitingWaitingOnList(profile: {
  enabled: boolean;
  coachSchoolList: string | null;
} | null | undefined) {
  if (!profile?.enabled) {
    return false;
  }
  return !profile.coachSchoolList?.trim();
}

function formatOptionalLine(label: string, value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? `${label}: ${trimmed}` : `${label}: --`;
}

export function buildRecruitingCopyForResearch(params: {
  firstName: string;
  ageGroupLabel: string | null;
  profile: RecruitingAnswersInput;
}) {
  const levels =
    params.profile.levelsOpenTo.length > 0 ? params.profile.levelsOpenTo.join(", ") : "--";

  return [
    `Player: ${params.firstName.trim() || "Player"}`,
    formatOptionalLine("Age group", params.ageGroupLabel),
    formatOptionalLine(
      "Grad year",
      params.profile.gradYear != null ? String(params.profile.gradYear) : null,
    ),
    formatOptionalLine("Primary position", params.profile.primaryPosition),
    formatOptionalLine("Secondary position", params.profile.secondaryPosition),
    `Levels open to: ${levels}`,
    formatOptionalLine(
      "Location",
      labelForRecruitingLocation(params.profile.locationPreference) || null,
    ),
    formatOptionalLine(
      "School size",
      labelForRecruitingSchoolSize(params.profile.schoolSize) || null,
    ),
    formatOptionalLine("Major / area of study", params.profile.majorOrStudy),
    formatOptionalLine("GPA range", params.profile.gpaRange),
    formatOptionalLine(
      "Scholarship money",
      labelForRecruitingScholarship(params.profile.scholarshipImportance) || null,
    ),
    formatOptionalLine("Video link", params.profile.videoUrl),
    formatOptionalLine("Notes for Coach Broc", params.profile.notesForCoach),
  ].join("\n");
}

export const RECRUITING_SCHOOL_LIST_PUSH_TITLE = "Coach Broc added your school list";
export const RECRUITING_SCHOOL_LIST_PUSH_BODY =
  "Open Recruiting on your profile to see Coach Broc's school list.";
export const RECRUITING_SCHOOL_LIST_PUSH_URL = "/profile";
