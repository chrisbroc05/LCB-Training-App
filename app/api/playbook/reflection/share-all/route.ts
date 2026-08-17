import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";
import { sendPlaybookReflectionSharedNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const progress = await ensurePlaybookProgress(access.user.id);
  const now = new Date();

  for (const chapter of progress.chapters) {
    const hasAnswers = chapter.reflections.some((reflection) => Boolean(reflection.answer?.trim()));
    if (!hasAnswers) {
      continue;
    }

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
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.chapterTitle,
      });
    } catch {
      // Email failure should not block sharing.
    }
  }

  const updatedProgress = await ensurePlaybookProgress(access.user.id);
  return NextResponse.json({
    progress: serializePlaybookProgress(updatedProgress),
  });
}
