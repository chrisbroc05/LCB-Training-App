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
  } catch (error) {
    console.error("[submission-vimeo-link] Invalid request body", {
      error: error instanceof Error ? error.message : String(error),
    });
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
    console.error("[submission-vimeo-link] Invalid Vimeo URL", {
      submissionId,
      submissionType,
      vimeoLink,
    });
    return NextResponse.json({ error: "Please provide a valid Vimeo video link." }, { status: 400 });
  }

  const normalizedLink = normalizeVimeoUrl(vimeoLink);

  try {
    if (submissionType === "mental") {
      const existing = await prisma.mentalGameSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true, memberVimeoLink: true },
      });

      if (!existing) {
        console.error("[submission-vimeo-link] Mental submission not found", {
          submissionId,
        });
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }

      const updated = await prisma.mentalGameSubmission.update({
        where: { id: submissionId },
        data: { memberVimeoLink: normalizedLink },
      });

      console.info("[submission-vimeo-link] Saved mental submission Vimeo link", {
        submissionId,
        previousLink: existing.memberVimeoLink,
        memberVimeoLink: updated.memberVimeoLink,
      });

      return NextResponse.json({
        success: true,
        memberVimeoLink: updated.memberVimeoLink,
      });
    }

    const existing = await prisma.swingAnalysisSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, memberVimeoLink: true },
    });

    if (!existing) {
      console.error("[submission-vimeo-link] Swing submission not found", {
        submissionId,
      });
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updated = await prisma.swingAnalysisSubmission.update({
      where: { id: submissionId },
      data: { memberVimeoLink: normalizedLink },
    });

    console.info("[submission-vimeo-link] Saved swing submission Vimeo link", {
      submissionId,
      previousLink: existing.memberVimeoLink,
      memberVimeoLink: updated.memberVimeoLink,
    });

    return NextResponse.json({
      success: true,
      memberVimeoLink: updated.memberVimeoLink,
    });
  } catch (error) {
    console.error("[submission-vimeo-link] Failed to save member Vimeo link", {
      submissionId,
      submissionType,
      vimeoLink,
      normalizedLink,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Unable to save video link." }, { status: 500 });
  }
}
