import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { authOptions } from "@/lib/auth";
import { getPlatformCoachingSettings } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";

type UpdateBody = {
  allAccessProgramCap?: number;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformCoachingSettings();
  return NextResponse.json({
    allAccessProgramCap: settings.allAccessProgramCap,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cap = Number(body.allAccessProgramCap);
  if (!Number.isFinite(cap) || cap < 1) {
    return NextResponse.json({ error: "Enter a valid program cap (at least 1)." }, { status: 400 });
  }

  const settings = await prisma.platformCoachingSettings.upsert({
    where: { id: "default" },
    create: { id: "default", allAccessProgramCap: Math.floor(cap) },
    update: { allAccessProgramCap: Math.floor(cap) },
  });

  return NextResponse.json({ allAccessProgramCap: settings.allAccessProgramCap });
}
