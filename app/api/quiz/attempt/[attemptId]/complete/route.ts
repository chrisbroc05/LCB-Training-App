import { NextResponse } from "next/server";
import { sendPlayerIqQuizResultsEmail } from "@/lib/player-iq-quiz-emails-server";
import type { PlayerIqAnswers } from "@/lib/player-iq-quiz-shared";
import { completeQuizAttempt, resolveQuizAccess } from "@/lib/player-iq-quiz-server";
import { LEAD_COOKIE_MAX_AGE_SECONDS, LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { QUIZ_ATTEMPT_COOKIE_NAME, QUIZ_REFERRAL_COOKIE_NAME } from "@/lib/quiz-session-cookies";

type RouteContext = { params: Promise<{ attemptId: string }> };

type Body = {
  answers?: PlayerIqAnswers;
  firstName?: string;
  email?: string;
  role?: LeadRoleValue;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
};

function readCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const leadIdFromCookie = readCookie(cookieHeader, LEAD_COOKIE_NAME);
  const quizAttemptIdFromCookie = readCookie(cookieHeader, QUIZ_ATTEMPT_COOKIE_NAME);

  const access = await resolveQuizAccess({ leadIdFromCookie, quizAttemptIdFromCookie });
  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const leadFields = access.userId
    ? undefined
    : {
        firstName: body.firstName ?? "",
        email: body.email ?? "",
        role: (body.role ?? "PLAYER") as LeadRoleValue,
        playerAge13Plus: body.playerAge13Plus,
        parentEmail: body.parentEmail,
      };

  const result = await completeQuizAttempt({
    attemptId,
    answers: body.answers,
    access,
    leadFields,
  });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }
    if (result.error === "ALREADY_COMPLETED") {
      return NextResponse.json({ error: "Quiz already completed." }, { status: 409 });
    }
    if (result.error === "LEAD_FIELDS_REQUIRED") {
      return NextResponse.json({ error: "Lead fields required." }, { status: 400 });
    }
    if (result.error === "LEAD_INVALID") {
      return NextResponse.json(
        { error: "message" in result ? result.message : "Invalid lead fields." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { access: finalAccess } = result;

  void sendPlayerIqQuizResultsEmail({
    attemptId,
    toEmail: finalAccess.email,
    firstName: finalAccess.firstName,
    role: finalAccess.role,
    leadId: finalAccess.leadId,
    score: result.score,
    level: result.level,
    categoryScores: result.categoryScores,
    lowestCategory: result.lowestCategory,
    answers: body.answers,
  }).catch((error) => {
    console.error("[quiz-complete-email]", error);
  });

  const response = NextResponse.json({
    attemptId,
    score: result.score,
    level: result.level,
    categoryScores: result.categoryScores,
    lowestCategory: result.lowestCategory,
    firstName: finalAccess.firstName,
    role: finalAccess.role,
  });

  response.cookies.set(QUIZ_ATTEMPT_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(QUIZ_REFERRAL_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  if (finalAccess.leadId) {
    response.cookies.set(LEAD_COOKIE_NAME, finalAccess.leadId, {
      maxAge: LEAD_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
