import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRecruitingHelp } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import {
  getOrCreateRecruitingProfile,
  parseRecruitingAnswersBody,
} from "@/lib/recruiting-server";
import { serializeRecruitingProfile } from "@/lib/recruiting-shared";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });
  if (!user || !canAccessRecruitingHelp(toAccessUserFields(user))) {
    return NextResponse.json({ error: "Recruiting help is for program players." }, { status: 403 });
  }

  const profile = await prisma.recruitingProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    available: true,
    profile: serializeRecruitingProfile(profile),
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });
  if (!user || !canAccessRecruitingHelp(toAccessUserFields(user))) {
    return NextResponse.json({ error: "Recruiting help is for program players." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await getOrCreateRecruitingProfile(session.user.id);
  const data: {
    enabled?: boolean;
    gradYear?: number | null;
    primaryPosition?: string | null;
    secondaryPosition?: string | null;
    levelsOpenTo?: string[];
    locationPreference?: string | null;
    schoolSize?: string | null;
    majorOrStudy?: string | null;
    gpaRange?: string | null;
    scholarshipImportance?: string | null;
    videoUrl?: string | null;
    notesForCoach?: string | null;
    answersUpdatedAt?: Date;
  } = {};

  if (typeof body.enabled === "boolean") {
    data.enabled = body.enabled;
  }

  if (body.answers !== undefined) {
    const parsed = parseRecruitingAnswersBody(body.answers);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    Object.assign(data, parsed.answers);
    data.answersUpdatedAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const profile = await prisma.recruitingProfile.update({
    where: { id: existing.id },
    data,
  });

  return NextResponse.json({
    available: true,
    profile: serializeRecruitingProfile(profile),
  });
}
