import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getProgramDay, parseProgramDateKey } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { startDate?: string } | null;
  const startDate = body?.startDate?.trim();

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: "A valid start date is required." }, { status: 400 });
  }

  const enrollment = await prisma.programEnrollment.update({
    where: { id },
    data: {
      startDate: parseProgramDateKey(startDate),
    },
  });

  const schedule = getProgramDay({ startDate: enrollment.startDate });

  return NextResponse.json({
    enrollment: {
      id: enrollment.id,
      startDate: enrollment.startDate?.toISOString().slice(0, 10) ?? null,
      currentProgramDay: schedule.programDay,
      weekNumber: schedule.weekNumber,
      phase: schedule.phase,
    },
  });
}
