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

  const submissions = await prisma.goalCheckin.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      playerName: submission.user.name?.trim() || submission.user.email,
      userEmail: submission.user.email,
      focusArea: submission.focusArea,
      createdAt: submission.createdAt.toISOString(),
      badgeStatus: submission.status === "pending" ? "PENDING" : "RESPONDED",
    })),
  });
}
