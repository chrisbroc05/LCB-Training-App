import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true,
      orgTeamId: true,
      organization: {
        select: {
          name: true,
          teams: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, name: true },
          },
        },
      },
      orgTeam: { select: { id: true, name: true, active: true } },
    },
  });

  if (!user?.organizationId || !user.organization) {
    return NextResponse.json({ organization: null });
  }

  return NextResponse.json({
    organization: {
      id: user.organizationId,
      name: user.organization.name,
      orgTeamId: user.orgTeamId,
      orgTeamName: user.orgTeam?.name ?? null,
      orgTeamActive: user.orgTeam?.active ?? null,
      teams: user.organization.teams,
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { orgTeamId?: string | null };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return NextResponse.json({ error: "You are not linked to an organization." }, { status: 400 });
  }

  const orgTeamId = body.orgTeamId?.trim() || null;
  if (orgTeamId) {
    const team = await prisma.orgTeam.findFirst({
      where: { id: orgTeamId, organizationId: user.organizationId, active: true },
    });
    if (!team) {
      return NextResponse.json({ error: "Choose a valid active team." }, { status: 400 });
    }
  }

  const changedAt = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      orgTeamId,
      orgTeamChangedAt: orgTeamId ? changedAt : null,
    },
  });

  return NextResponse.json({ success: true, orgTeamId });
}
