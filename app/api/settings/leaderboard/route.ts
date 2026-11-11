import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hideFromLeaderboards: true, accountRole: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    hideFromLeaderboards: user.hideFromLeaderboards,
    accountRole: user.accountRole,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { hideFromLeaderboards?: boolean };
  if (typeof body.hideFromLeaderboards !== "boolean") {
    return NextResponse.json({ error: "hideFromLeaderboards is required." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hideFromLeaderboards: body.hideFromLeaderboards },
  });

  return NextResponse.json({
    success: true,
    message: "Leaderboard preference saved",
    hideFromLeaderboards: body.hideFromLeaderboards,
  });
}
