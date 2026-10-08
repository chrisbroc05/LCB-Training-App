import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildAdminProgramPlayerDetail,
  buildAdminWeekDayTasks,
} from "@/lib/admin-program-player";
import { loadEnrollmentPlanOverrideBundle } from "@/lib/program-plan-overrides-server";
import { toEnrollmentPlanInput } from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";
import {
  PROGRAM_EQUIPMENT_OPTIONS,
  PROGRAM_FOCUS_AREAS,
  type ProgramAgeGroup,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
  type ProgramSeasonMode,
} from "@/lib/program-enrollment-shared";
import { isStrengthVariant, type StrengthVariant } from "@/lib/strength-variant-shared";

type RouteContext = {
  params: Promise<{ enrollmentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const { searchParams } = new URL(request.url);
  const weekNumber = Number(searchParams.get("week") ?? "0");

  const detail = await buildAdminProgramPlayerDetail(enrollmentId);
  if (!detail) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const selectedWeek = weekNumber >= 1 && weekNumber <= 12 ? weekNumber : detail.schedule.weekNumber;
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollmentId);
  const enrollmentRecord = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      taskCompletions: {
        select: {
          programDay: true,
          taskKey: true,
          note: true,
          completedAt: true,
        },
      },
    },
  });

  const weekDays =
    detail.planInput && enrollmentRecord
      ? buildAdminWeekDayTasks({
          enrollment: enrollmentRecord,
          planInput: detail.planInput,
          weekNumber: selectedWeek,
          overrideBundle,
        })
      : [];

  const cues = await prisma.coachCue.findMany({
    where: { archived: false },
    orderBy: [{ isDefault: "desc" }, { defaultWeek: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({
    ...detail,
    selectedWeek,
    weekDays,
    cues: cues.map((cue) => ({
      id: cue.id,
      label: cue.label,
      drillIds: cue.drillIds,
      isDefault: cue.isDefault,
      defaultWeek: cue.defaultWeek,
      displayLabel: cue.isDefault && cue.defaultWeek
        ? `Week ${cue.defaultWeek}: ${cue.label}`
        : cue.label,
    })),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    seasonMode?: ProgramSeasonMode;
    ageGroup?: ProgramAgeGroup;
    focusAreas?: string[];
    equipment?: string[];
    strengthVariant?: string;
    isTestAccount?: boolean;
  } | null;

  const existing = await prisma.programEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!existing) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const data: {
    seasonMode?: ProgramSeasonMode;
    ageGroup?: ProgramAgeGroup;
    focusAreas?: string[];
    equipment?: string[];
    strengthVariant?: StrengthVariant;
  } = {};

  if (body?.seasonMode === "IN_SEASON" || body?.seasonMode === "OFF_SEASON") {
    data.seasonMode = body.seasonMode;
  }

  if (body?.ageGroup === "AGE_8_11" || body?.ageGroup === "AGE_12_15" || body?.ageGroup === "AGE_16_18") {
    data.ageGroup = body.ageGroup;
  }

  if (Array.isArray(body?.focusAreas)) {
    data.focusAreas = body.focusAreas.filter((item): item is ProgramFocusArea =>
      PROGRAM_FOCUS_AREAS.includes(item as ProgramFocusArea),
    );
  }

  if (Array.isArray(body?.equipment)) {
    data.equipment = body.equipment.filter((item): item is ProgramEquipmentOption =>
      PROGRAM_EQUIPMENT_OPTIONS.includes(item as ProgramEquipmentOption),
    );
  }

  if (body?.strengthVariant && isStrengthVariant(body.strengthVariant)) {
    data.strengthVariant = body.strengthVariant;
  }

  if (typeof body?.isTestAccount === "boolean") {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { isTestAccount: body.isTestAccount },
    });
  }

  const enrollment =
    Object.keys(data).length > 0
      ? await prisma.programEnrollment.update({
          where: { id: enrollmentId },
          data,
        })
      : existing;

  return NextResponse.json({ enrollment });
}
