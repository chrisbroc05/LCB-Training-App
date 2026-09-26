import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ProgramAgeGroup, ProgramSeasonMode } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  isProgramEquipmentOption,
  isProgramFocusArea,
  normalizeEquipment,
  normalizeFocusAreas,
  PROGRAM_POSITION_OPTIONS,
  serializeProgramEnrollment,
} from "@/lib/program-enrollment";
import {
  getChicagoTodayDateKey,
  getChicagoTomorrowDateKey,
  parseProgramDateKey,
} from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

const AGE_GROUPS: ProgramAgeGroup[] = ["AGE_8_11", "AGE_12_15", "AGE_16_18"];
const SEASON_MODES: ProgramSeasonMode[] = ["IN_SEASON", "OFF_SEASON"];

function isAgeGroup(value: unknown): value is ProgramAgeGroup {
  return typeof value === "string" && AGE_GROUPS.includes(value as ProgramAgeGroup);
}

function isSeasonMode(value: unknown): value is ProgramSeasonMode {
  return typeof value === "string" && SEASON_MODES.includes(value as ProgramSeasonMode);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
    return NextResponse.json({ error: "Program access required." }, { status: 403 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Program enrollment not found." }, { status: 404 });
  }

  return NextResponse.json({ enrollment: serializeProgramEnrollment(enrollment) });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, name: true, email: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
    return NextResponse.json({ error: "Program access required." }, { status: 403 });
  }

  const existing = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Program enrollment not found." }, { status: 404 });
  }

  if (existing.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is already complete." }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: {
    ageGroup?: ProgramAgeGroup;
    position?: string;
    focusAreas?: string[];
    equipment?: string[];
    seasonMode?: ProgramSeasonMode;
    knownFor?: string;
    startDate?: Date;
    onboardingCompletedAt?: Date;
  } = {};

  if ("ageGroup" in body) {
    if (!isAgeGroup(body.ageGroup)) {
      return NextResponse.json({ error: "Invalid age group." }, { status: 400 });
    }

    data.ageGroup = body.ageGroup;
  }

  if ("position" in body) {
    if (typeof body.position !== "string" || !PROGRAM_POSITION_OPTIONS.includes(body.position as typeof PROGRAM_POSITION_OPTIONS[number])) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }

    data.position = body.position;
  }

  if ("focusAreas" in body) {
    if (!Array.isArray(body.focusAreas)) {
      return NextResponse.json({ error: "Focus areas must be an array." }, { status: 400 });
    }

    const normalized = normalizeFocusAreas(body.focusAreas.filter((value) => typeof value === "string"));
    if (normalized.length === 0 || normalized.length > 2) {
      return NextResponse.json({ error: "Pick 1 or 2 focus areas." }, { status: 400 });
    }

    for (const value of body.focusAreas) {
      if (typeof value !== "string" || !isProgramFocusArea(value)) {
        return NextResponse.json({ error: "Invalid focus area." }, { status: 400 });
      }
    }

    data.focusAreas = normalized;
  }

  if ("equipment" in body) {
    if (!Array.isArray(body.equipment)) {
      return NextResponse.json({ error: "Equipment must be an array." }, { status: 400 });
    }

    for (const value of body.equipment) {
      if (typeof value !== "string" || !isProgramEquipmentOption(value)) {
        return NextResponse.json({ error: "Invalid equipment option." }, { status: 400 });
      }
    }

    const normalized = normalizeEquipment(body.equipment.filter((value) => typeof value === "string"));
    if (normalized.length === 0) {
      return NextResponse.json({ error: "Pick at least one equipment option." }, { status: 400 });
    }

    data.equipment = normalized;
  }

  if ("seasonMode" in body) {
    if (!isSeasonMode(body.seasonMode)) {
      return NextResponse.json({ error: "Invalid season mode." }, { status: 400 });
    }

    data.seasonMode = body.seasonMode;
  }

  if ("knownFor" in body) {
    if (typeof body.knownFor !== "string") {
      return NextResponse.json({ error: "Known-for sentence is required." }, { status: 400 });
    }

    const trimmed = body.knownFor.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Known-for sentence is required." }, { status: 400 });
    }

    if (trimmed.length > 200) {
      return NextResponse.json({ error: "Known-for sentence must be 200 characters or less." }, { status: 400 });
    }

    data.knownFor = trimmed;
  }

  if ("startChoice" in body) {
    if (body.startChoice !== "today" && body.startChoice !== "tomorrow") {
      return NextResponse.json({ error: "Invalid start choice." }, { status: 400 });
    }

    const dateKey =
      body.startChoice === "today" ? getChicagoTodayDateKey() : getChicagoTomorrowDateKey();
    data.startDate = parseProgramDateKey(dateKey);
  }

  if (body.completeOnboarding === true) {
    const merged = {
      ageGroup: data.ageGroup ?? existing.ageGroup,
      position: data.position ?? existing.position,
      focusAreas: data.focusAreas ?? existing.focusAreas,
      equipment: data.equipment ?? existing.equipment,
      seasonMode: data.seasonMode ?? existing.seasonMode,
      knownFor: data.knownFor ?? existing.knownFor,
      startDate: data.startDate ?? existing.startDate,
    };

    if (
      !merged.ageGroup ||
      !merged.position ||
      merged.focusAreas.length === 0 ||
      merged.equipment.length === 0 ||
      !merged.seasonMode ||
      !merged.knownFor ||
      !merged.startDate
    ) {
      return NextResponse.json({ error: "Complete every question before finishing setup." }, { status: 400 });
    }

    data.onboardingCompletedAt = new Date();
  }

  const updated = await prisma.programEnrollment.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json({ enrollment: serializeProgramEnrollment(updated) });
}
