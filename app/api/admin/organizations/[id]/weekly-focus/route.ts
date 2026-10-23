import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getWeekStartMondayUtc } from "@/lib/org-weekly-focus-shared";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const weekStart = getWeekStartMondayUtc();
  const focuses = await prisma.orgWeeklyFocus.findMany({
    where: { organizationId: id, weekStartDate: weekStart },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ focuses });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const weekStart = getWeekStartMondayUtc();
  const orgTeamId = body.orgTeamId ? String(body.orgTeamId) : null;
  const notes = body.notes ? String(body.notes).trim() : null;
  const drillIds = Array.isArray(body.drillIds)
    ? body.drillIds.map((entry) => String(entry).trim()).filter(Boolean)
    : [];

  const existing = await prisma.orgWeeklyFocus.findFirst({
    where: {
      organizationId: id,
      orgTeamId,
      weekStartDate: weekStart,
    },
  });

  if (existing) {
    await prisma.orgWeeklyFocus.update({
      where: { id: existing.id },
      data: { title, notes, drillIds },
    });
  } else {
    await prisma.orgWeeklyFocus.create({
      data: {
        organizationId: id,
        orgTeamId,
        weekStartDate: weekStart,
        title,
        notes,
        drillIds,
      },
    });
  }

  const focuses = await prisma.orgWeeklyFocus.findMany({
    where: { organizationId: id, weekStartDate: weekStart },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, focuses });
}
