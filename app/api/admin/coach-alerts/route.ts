import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getCoachAlertSettingsForUser,
  updateCoachAlertSettings,
} from "@/lib/coach-alert-settings";
import { isPushEnabled } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!isAdminEmail(session?.user?.email) || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscriptionCount = await prisma.pushSubscription.count({
    where: { userId },
  });

  const settings = await getCoachAlertSettingsForUser(userId);

  return NextResponse.json({
    enabled: isPushEnabled(),
    subscribed: subscriptionCount > 0,
    subscriptionCount,
    settings,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!isAdminEmail(session?.user?.email) || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Partial<{
    newVideosEnabled: boolean;
    newProgramPlayersEnabled: boolean;
    nightlySummaryPushEnabled: boolean;
    emailNightlySummaryEnabled: boolean;
  }> = {};

  for (const key of [
    "newVideosEnabled",
    "newProgramPlayersEnabled",
    "nightlySummaryPushEnabled",
    "emailNightlySummaryEnabled",
  ] as const) {
    if (key in body) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json({ error: `Invalid ${key} value.` }, { status: 400 });
      }
      data[key] = body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const settings = await updateCoachAlertSettings(userId, data);

  return NextResponse.json({ settings });
}
