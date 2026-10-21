import { NextResponse } from "next/server";
import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import {
  buildQuizQuestionsPayload,
  createQuizAttemptForAccess,
  ensureQuizAccessForStart,
} from "@/lib/player-iq-quiz-server";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${LEAD_COOKIE_NAME}=([^;]*)`));
  const leadIdFromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;

  const access = await ensureQuizAccessForStart({ leadIdFromCookie });
  if (!access) {
    return NextResponse.json({ error: "Lead or login required." }, { status: 401 });
  }

  const attempt = await createQuizAttemptForAccess(access);
  const optionOrder = attempt.optionOrder as Record<string, string[]>;

  return NextResponse.json({
    attemptId: attempt.id,
    firstName: access.firstName,
    role: access.role,
    questions: buildQuizQuestionsPayload(optionOrder),
  });
}
