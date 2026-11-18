import "server-only";

import {
  emptyRecruitingAnswers,
  isRecruitingGpaRange,
  isRecruitingLevel,
  isRecruitingLocation,
  isRecruitingPosition,
  isRecruitingScholarshipImportance,
  isRecruitingSchoolSize,
  type RecruitingAnswersInput,
} from "@/lib/recruiting-shared";
import { prisma } from "@/lib/prisma";

function optionalTrimmedString(value: unknown, maxLen: number) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLen);
}

function optionalHttpUrl(value: unknown) {
  const trimmed = optionalTrimmedString(value, 500);
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

export function parseRecruitingAnswersBody(body: unknown): {
  ok: true;
  answers: RecruitingAnswersInput;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid recruiting answers." };
  }

  const raw = body as Record<string, unknown>;
  const answers = emptyRecruitingAnswers();

  if (raw.gradYear === null || raw.gradYear === "") {
    answers.gradYear = null;
  } else if (typeof raw.gradYear === "number" && Number.isInteger(raw.gradYear)) {
    answers.gradYear = raw.gradYear;
  } else if (typeof raw.gradYear === "string" && /^\d{4}$/.test(raw.gradYear.trim())) {
    answers.gradYear = Number(raw.gradYear.trim());
  } else if (raw.gradYear !== undefined) {
    return { ok: false, error: "Invalid grad year." };
  }

  const primary = optionalTrimmedString(raw.primaryPosition, 60);
  if (primary && !isRecruitingPosition(primary)) {
    return { ok: false, error: "Invalid primary position." };
  }
  answers.primaryPosition = primary;

  const secondary = optionalTrimmedString(raw.secondaryPosition, 60);
  if (secondary && !isRecruitingPosition(secondary)) {
    return { ok: false, error: "Invalid secondary position." };
  }
  answers.secondaryPosition = secondary;

  if (Array.isArray(raw.levelsOpenTo)) {
    const levels: string[] = [];
    for (const item of raw.levelsOpenTo) {
      if (typeof item !== "string" || !isRecruitingLevel(item)) {
        return { ok: false, error: "Invalid levels open to." };
      }
      if (!levels.includes(item)) {
        levels.push(item);
      }
    }
    answers.levelsOpenTo = levels;
  }

  const location = optionalTrimmedString(raw.locationPreference, 40);
  if (location && !isRecruitingLocation(location)) {
    return { ok: false, error: "Invalid location preference." };
  }
  answers.locationPreference = location;

  const schoolSize = optionalTrimmedString(raw.schoolSize, 40);
  if (schoolSize && !isRecruitingSchoolSize(schoolSize)) {
    return { ok: false, error: "Invalid school size." };
  }
  answers.schoolSize = schoolSize;

  answers.majorOrStudy = optionalTrimmedString(raw.majorOrStudy, 120);

  const gpaRange = optionalTrimmedString(raw.gpaRange, 40);
  if (gpaRange && !isRecruitingGpaRange(gpaRange)) {
    return { ok: false, error: "Invalid GPA range." };
  }
  answers.gpaRange = gpaRange;

  const scholarship = optionalTrimmedString(raw.scholarshipImportance, 40);
  if (scholarship && !isRecruitingScholarshipImportance(scholarship)) {
    return { ok: false, error: "Invalid scholarship importance." };
  }
  answers.scholarshipImportance = scholarship;

  const videoUrl = optionalHttpUrl(raw.videoUrl);
  if (typeof raw.videoUrl === "string" && raw.videoUrl.trim() && !videoUrl) {
    return { ok: false, error: "Video link must be an http or https URL." };
  }
  answers.videoUrl = videoUrl;

  answers.notesForCoach = optionalTrimmedString(raw.notesForCoach, 2000);

  return { ok: true, answers };
}

export async function getOrCreateRecruitingProfile(userId: string) {
  const existing = await prisma.recruitingProfile.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }
  return prisma.recruitingProfile.create({
    data: { userId, enabled: false },
  });
}

export function programAgeGroupLabel(ageGroup: string | null | undefined) {
  switch (ageGroup) {
    case "AGE_8_11":
      return "8-11";
    case "AGE_12_15":
      return "12-15";
    case "AGE_16_18":
      return "16-18";
    default:
      return ageGroup?.trim() || null;
  }
}
