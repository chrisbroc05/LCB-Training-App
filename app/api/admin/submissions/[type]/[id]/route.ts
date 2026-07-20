import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { memberProfileSelect, serializeMemberProfile } from "@/lib/player-profile";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  if (params.type === "mental") {
    const submission = await prisma.mentalGameSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: memberProfileSelect,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { user, ...submissionData } = submission;

    return NextResponse.json({
      submission: {
        ...submissionData,
        badgeStatus: submission.status === "PENDING" ? "PENDING" : "RESPONDED",
        memberProfile: serializeMemberProfile(user),
      },
    });
  }

  if (params.type === "swing") {
    const submission = await prisma.swingAnalysisSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: memberProfileSelect,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { user, ...submissionData } = submission;

    return NextResponse.json({
      submission: {
        ...submissionData,
        badgeStatus: submission.status === "PENDING" ? "PENDING" : "RESPONDED",
        memberProfile: serializeMemberProfile(user),
      },
    });
  }

  return NextResponse.json({ error: "Invalid submission type" }, { status: 400 });
}
