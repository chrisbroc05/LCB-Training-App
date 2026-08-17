import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";
import { prisma } from "@/lib/prisma";

type SaveReflectionBody = {
  chapterNumber?: number;
  questionNumber?: number;
  questionText?: string;
  answer?: string;
};

export async function POST(request: Request) {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const body = (await request.json().catch(() => ({}))) as SaveReflectionBody;
  const chapterNumber = Number(body.chapterNumber);
  const questionNumber = Number(body.questionNumber);
  const questionText = body.questionText?.trim();
  const answer = body.answer?.trim() ?? "";

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 4) {
    return NextResponse.json({ error: "Invalid chapter number." }, { status: 400 });
  }

  if (!Number.isInteger(questionNumber) || questionNumber < 1) {
    return NextResponse.json({ error: "Invalid question number." }, { status: 400 });
  }

  if (!questionText) {
    return NextResponse.json({ error: "Question text is required." }, { status: 400 });
  }

  const progress = await ensurePlaybookProgress(access.user.id);
  const chapter = progress.chapters.find((item) => item.chapterNumber === chapterNumber);

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }

  await prisma.playbookReflection.upsert({
    where: {
      chapterId_questionNumber: {
        chapterId: chapter.id,
        questionNumber,
      },
    },
    create: {
      chapterId: chapter.id,
      questionNumber,
      questionText,
      answer: answer || null,
    },
    update: {
      questionText,
      answer: answer || null,
    },
  });

  const updatedProgress = await ensurePlaybookProgress(access.user.id);
  return NextResponse.json({
    progress: serializePlaybookProgress(updatedProgress),
  });
}
