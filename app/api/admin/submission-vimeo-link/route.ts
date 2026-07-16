import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isValidVimeoUrl, normalizeVimeoUrl } from "@/lib/vimeo";

type SubmissionType = "swing" | "mental";

type RequestBody = {
  submissionId?: string;
  submissionType?: SubmissionType;
  vimeoLink?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim();
  const submissionType = body.submissionType;
  const vimeoLink = body.vimeoLink?.trim() ?? "";

  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  if (submissionType !== "swing" && submissionType !== "mental") {
    return NextResponse.json({ error: "submissionType must be swing or mental." }, { status: 400 });
  }

  if (!vimeoLink) {
    return NextResponse.json({ error: "vimeoLink is required." }, { status: 400 });
  }

  if (!isValidVimeoUrl(vimeoLink)) {
    return NextResponse.json({ error: "Please provide a valid Vimeo video link." }, { status: 400 });
  }

  const normalizedLink = normalizeVimeoUrl(vimeoLink);

  if (submissionType === "mental") {
    const existing = await prisma.mentalGameSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updated = await prisma.mentalGameSubmission.update({
      where: { id: submissionId },
      data: { memberVimeoLink: normalizedLink },
    });

    return NextResponse.json({
      success: true,
      memberVimeoLink: updated.memberVimeoLink,
    });
  }

  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  const updated = await prisma.swingAnalysisSubmission.update({
    where: { id: submissionId },
    data: { memberVimeoLink: normalizedLink },
  });

  return NextResponse.json({
    success: true,
    memberVimeoLink: updated.memberVimeoLink,
  });
}
