import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { createAppNotification } from "@/lib/app-notifications";
import { sendSubmissionResponseEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { shouldSendNotificationEmail } from "@/lib/user-notification-preferences";
import { isValidVimeoUrl } from "@/lib/vimeo";

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  if (params.type !== "swing" && params.type !== "mental") {
    return NextResponse.json({ error: "Invalid submission type." }, { status: 400 });
  }

  const formData = await request.formData();
  const writtenResponse = String(formData.get("writtenResponse") ?? "").trim();
  const responseVideoUrl = String(formData.get("responseVideoUrl") ?? "").trim();

  if (responseVideoUrl && !isValidVimeoUrl(responseVideoUrl)) {
    return NextResponse.json({ error: "Please provide a valid Vimeo video link." }, { status: 400 });
  }

  if (params.type === "mental") {
    const existing = await prisma.mentalGameSubmission.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const finalVideoUrl = responseVideoUrl || existing.responseVideoUrl || null;
    const finalText = writtenResponse || null;

    if (!finalText && !finalVideoUrl) {
      return NextResponse.json(
        { error: "Provide a written response, upload a video, or paste a Vimeo link." },
        { status: 400 },
      );
    }

    const updated = await prisma.mentalGameSubmission.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        responseText: finalText,
        responseVideoUrl: finalVideoUrl,
        respondedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { membershipTier: true },
    });

    const shouldSendEmail = await shouldSendNotificationEmail(
      updated.userId,
      "notifySubmissionResponse",
    );

    if (shouldSendEmail) {
      await sendSubmissionResponseEmail({
        toEmail: updated.userEmail,
        playerName: updated.playerName,
        submissionType: "MENTAL_GAME",
        responseMode: finalVideoUrl ? "VIDEO" : "WRITTEN",
        membershipTier: user?.membershipTier,
        writtenResponse: finalText ?? undefined,
        videoResponseUrl: finalVideoUrl ?? undefined,
      });
    }

    await createAppNotification({
      userId: updated.userId,
      title: "Coach Broc responded",
      body: "Your coaching submission feedback is ready to review.",
      type: "submission_response",
      linkUrl: `/profile?type=mental&id=${updated.id}`,
    });

    return NextResponse.json({ success: true });
  }

  const existing = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  const finalVideoUrl = responseVideoUrl || existing.responseVideoUrl || null;
  const finalText = writtenResponse || null;

  if (!finalText && !finalVideoUrl) {
    return NextResponse.json(
      { error: "Provide a written response, upload a video, or paste a Vimeo link." },
      { status: 400 },
    );
  }

  const updated = await prisma.swingAnalysisSubmission.update({
    where: { id: params.id },
    data: {
      status: "COMPLETED",
      responseText: finalText,
      responseVideoUrl: finalVideoUrl,
      respondedAt: new Date(),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: updated.userId },
    select: { membershipTier: true },
  });

  const shouldSendEmail = await shouldSendNotificationEmail(
    updated.userId,
    "notifySubmissionResponse",
  );

  if (shouldSendEmail) {
    await sendSubmissionResponseEmail({
      toEmail: updated.userEmail,
      playerName: updated.playerName,
      submissionType: "SWING_ANALYSIS",
      responseMode: finalVideoUrl ? "VIDEO" : "WRITTEN",
      membershipTier: user?.membershipTier,
      writtenResponse: finalText ?? undefined,
      videoResponseUrl: finalVideoUrl ?? undefined,
    });
  }

  await createAppNotification({
    userId: updated.userId,
    title: "Coach Broc responded",
    body: "Your coaching submission feedback is ready to review.",
    type: "submission_response",
    linkUrl: `/profile?type=swing&id=${updated.id}`,
  });

  return NextResponse.json({ success: true });
}
