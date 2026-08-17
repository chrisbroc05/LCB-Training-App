import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";
import { sendPlaybookReflectionSharedNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type ShareReflectionBody = {
  chapterNumber?: number;
};

export async function POST(request: Request) {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const body = (await request.json().catch(() => ({}))) as ShareReflectionBody;
  const chapterNumber = Number(body.chapterNumber);

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 4) {
    return NextResponse.json({ error: "Invalid chapter number." }, { status: 400 });
  }

  const progress = await ensurePlaybookProgress(access.user.id);
  const chapter = progress.chapters.find((item) => item.chapterNumber === chapterNumber);

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }

  const now = new Date();
  await prisma.playbookReflection.updateMany({
    where: {
      chapterId: chapter.id,
      answer: { not: null },
    },
    data: {
      sharedWithCoach: true,
      sharedAt: now,
    },
  });

  try {
    await sendPlaybookReflectionSharedNotification({
      memberName: access.user.name ?? "Member",
      memberEmail: access.user.email,
      membershipTier: access.user.membershipTier,
      chapterNumber,
      chapterTitle: chapter.chapterTitle,
    });
  } catch {
    // Email failure should not block sharing.
  }

  const updatedProgress = await ensurePlaybookProgress(access.user.id);
  return NextResponse.json({
    progress: serializePlaybookProgress(updatedProgress),
  });
}
