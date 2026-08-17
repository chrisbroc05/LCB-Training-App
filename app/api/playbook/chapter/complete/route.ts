import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { markChapterComplete, ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";

type CompleteChapterBody = {
  chapterNumber?: number;
};

export async function POST(request: Request) {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const body = (await request.json().catch(() => ({}))) as CompleteChapterBody;
  const chapterNumber = Number(body.chapterNumber);

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 4) {
    return NextResponse.json({ error: "Invalid chapter number." }, { status: 400 });
  }

  const result = await markChapterComplete(access.user.id, chapterNumber);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const progress = await ensurePlaybookProgress(access.user.id);
  return NextResponse.json({
    allComplete: result.allComplete,
    progress: serializePlaybookProgress(progress),
  });
}
