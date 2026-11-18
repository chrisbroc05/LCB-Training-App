import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { getChicagoTodayDateKey } from "@/lib/program-schedule";
import {
  buildRecruitingCopyForResearch,
  RECRUITING_SCHOOL_LIST_PUSH_BODY,
  RECRUITING_SCHOOL_LIST_PUSH_TITLE,
  RECRUITING_SCHOOL_LIST_PUSH_URL,
  serializeRecruitingProfile,
} from "@/lib/recruiting-shared";
import { programAgeGroupLabel } from "@/lib/recruiting-server";
import { buildPushDedupeKey, sendPushToUser } from "@/lib/push-send";
import { splitFullName } from "@/lib/player-profile";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      playerFirstName: true,
      programEnrollment: { select: { ageGroup: true } },
      recruitingProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const firstName =
    user.playerFirstName?.trim() || splitFullName(user.name).firstName || "Player";
  const profile = serializeRecruitingProfile(user.recruitingProfile);
  const copyText = buildRecruitingCopyForResearch({
    firstName,
    ageGroupLabel: programAgeGroupLabel(user.programEnrollment?.ageGroup),
    profile,
  });

  return NextResponse.json({
    profile,
    copyText,
    firstName,
    ageGroupLabel: programAgeGroupLabel(user.programEnrollment?.ageGroup),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    coachSchoolList?: string;
    notifyPlayer?: boolean;
  } | null;

  if (!body || typeof body.coachSchoolList !== "string") {
    return NextResponse.json({ error: "School list is required." }, { status: 400 });
  }

  const notifyPlayer = body.notifyPlayer !== false;
  const coachSchoolList = body.coachSchoolList.trim()
    ? body.coachSchoolList.trim().slice(0, 8000)
    : null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, recruitingProfile: { select: { id: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const profile = user.recruitingProfile
    ? await prisma.recruitingProfile.update({
        where: { id: user.recruitingProfile.id },
        data: {
          coachSchoolList,
          schoolListUpdatedAt: new Date(),
        },
      })
    : await prisma.recruitingProfile.create({
        data: {
          userId: id,
          enabled: false,
          coachSchoolList,
          schoolListUpdatedAt: new Date(),
        },
      });

  let pushSent = false;
  if (notifyPlayer && coachSchoolList) {
    const dateKey = getChicagoTodayDateKey();
    const dedupeKey = buildPushDedupeKey(
      id,
      "RECRUITING_SCHOOL_LIST",
      `${dateKey}:${profile.schoolListUpdatedAt?.getTime() ?? Date.now()}`,
    );
    await sendPushToUser(
      id,
      {
        title: RECRUITING_SCHOOL_LIST_PUSH_TITLE,
        body: RECRUITING_SCHOOL_LIST_PUSH_BODY,
        url: RECRUITING_SCHOOL_LIST_PUSH_URL,
      },
      { type: "RECRUITING_SCHOOL_LIST", dedupeKey },
    );
    pushSent = true;
  }

  return NextResponse.json({
    profile: serializeRecruitingProfile(profile),
    pushSent,
  });
}
