import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessPlaybook } from "@/lib/membership";
import { buildProgramTodayPayload } from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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

  if (!enrollment || !enrollment.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is not complete." }, { status: 409 });
  }

  const { searchParams } = new URL(request.url);
  const viewedProgramDayParam = searchParams.get("programDay");
  const viewedProgramDay = viewedProgramDayParam ? Number(viewedProgramDayParam) : undefined;

  const payload = await buildProgramTodayPayload({
    enrollment,
    userId: session.user.id,
    viewedProgramDay: Number.isFinite(viewedProgramDay) ? viewedProgramDay : undefined,
  });

  return NextResponse.json({
    ...payload,
    canAccessPlaybook: canAccessPlaybook(user.membershipTier),
  });
}
