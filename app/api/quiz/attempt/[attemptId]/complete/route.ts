import { NextResponse } from "next/server";
import { sendPlayerIqQuizResultsEmail } from "@/lib/player-iq-quiz-emails-server";
import type { PlayerIqAnswers } from "@/lib/player-iq-quiz-shared";
import { completeQuizAttempt, resolveQuizAccess } from "@/lib/player-iq-quiz-server";
import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const body = (await request.json().catch(() => null)) as { answers?: PlayerIqAnswers } | null;
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${LEAD_COOKIE_NAME}=([^;]*)`));
  const leadIdFromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;

  const access = await resolveQuizAccess({ leadIdFromCookie });
  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await completeQuizAttempt({
    attemptId,
    answers: body.answers,
    access,
  });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }
    if (result.error === "ALREADY_COMPLETED") {
      return NextResponse.json({ error: "Quiz already completed." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  void sendPlayerIqQuizResultsEmail({
    attemptId,
    toEmail: access.email,
    firstName: access.firstName,
    role: access.role,
    leadId: access.leadId,
    score: result.score,
    level: result.level,
    categoryScores: result.categoryScores,
    lowestCategory: result.lowestCategory,
    answers: body.answers,
  }).catch((error) => {
    console.error("[quiz-complete-email]", error);
  });

  return NextResponse.json({
    attemptId,
    score: result.score,
    level: result.level,
    categoryScores: result.categoryScores,
    lowestCategory: result.lowestCategory,
    firstName: access.firstName,
    role: access.role,
  });
}
