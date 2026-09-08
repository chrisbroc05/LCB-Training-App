import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isR2VideoReference } from "@/lib/r2";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const submissionType = String(formData.get("submissionType") ?? "swing").trim().toLowerCase();

  if (!submissionId) {
    return NextResponse.json({ error: "Missing submissionId." }, { status: 400 });
  }

  if (submissionType === "mental") {
    const existing = await prisma.mentalGameSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, responseVideoUrl: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (existing.responseVideoUrl && isR2VideoReference(existing.responseVideoUrl)) {
      await prisma.mentalGameSubmission.update({
        where: { id: submissionId },
        data: { responseVideoUrl: null },
      });
    }

    return NextResponse.json({ success: true });
  }

  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, responseVideoUrl: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  if (existing.responseVideoUrl && isR2VideoReference(existing.responseVideoUrl)) {
    await prisma.swingAnalysisSubmission.update({
      where: { id: submissionId },
      data: { responseVideoUrl: null },
    });
  }

  return NextResponse.json({ success: true });
}
