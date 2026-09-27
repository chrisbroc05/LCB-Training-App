import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cues = await prisma.coachCue.findMany({
    orderBy: [{ isDefault: "desc" }, { defaultWeek: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ cues });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    label?: string;
    drillIds?: string[];
  } | null;

  const label = body?.label?.trim();
  const drillIds = Array.isArray(body?.drillIds) ? body.drillIds.filter(Boolean) : [];

  if (!label) {
    return NextResponse.json({ error: "Label is required." }, { status: 400 });
  }

  const cue = await prisma.coachCue.create({
    data: {
      label,
      drillIds,
      isDefault: false,
    },
  });

  return NextResponse.json({ cue });
}
