import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatR2VideoReference, uploadResponseVideoToR2 } from "@/lib/r2";
import { MAX_SUBMISSION_VIDEO_BYTES } from "@/lib/submission-videos";

const MAX_RESPONSE_UPLOAD_BYTES = MAX_SUBMISSION_VIDEO_BYTES;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploadedVideo = formData.get("video");
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const submissionType = String(formData.get("submissionType") ?? "swing").trim().toLowerCase();

  if (!(uploadedVideo instanceof File) || uploadedVideo.size === 0 || !submissionId) {
    return NextResponse.json({ error: "Missing file or submissionId." }, { status: 400 });
  }

  if (uploadedVideo.size > MAX_RESPONSE_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error:
          "Your video is too large. Please trim or compress it to under 100MB and try again.",
      },
      { status: 413 },
    );
  }

  try {
    const r2Key = await uploadResponseVideoToR2(uploadedVideo);
    const responseVideoUrl = formatR2VideoReference(r2Key);

    if (submissionType === "mental") {
      const existing = await prisma.mentalGameSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }

      await prisma.mentalGameSubmission.update({
        where: { id: submissionId },
        data: { responseVideoUrl },
      });
    } else {
      const existing = await prisma.swingAnalysisSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }

      await prisma.swingAnalysisSubmission.update({
        where: { id: submissionId },
        data: { responseVideoUrl },
      });
    }

    return NextResponse.json({ success: true, key: r2Key, responseVideoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload response video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
