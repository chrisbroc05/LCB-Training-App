import { NextResponse } from "next/server";
import {
  createAnonymousQuizAttempt,
  createQuizAttemptForLoggedInUser,
  resolveQuizSessionForPage,
} from "@/lib/player-iq-quiz-server";
import {
  QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS,
  QUIZ_ATTEMPT_COOKIE_NAME,
  QUIZ_REFERRAL_CHALLENGE,
  QUIZ_REFERRAL_COOKIE_MAX_AGE_SECONDS,
  QUIZ_REFERRAL_COOKIE_NAME,
} from "@/lib/quiz-session-cookies";

function readCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function appendQuizAttemptCookie(response: NextResponse, attemptId: string) {
  response.cookies.set(QUIZ_ATTEMPT_COOKIE_NAME, attemptId, {
    maxAge: QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

function appendQuizReferralCookie(response: NextResponse, referral: string | null) {
  if (!referral) {
    return;
  }
  response.cookies.set(QUIZ_REFERRAL_COOKIE_NAME, referral, {
    maxAge: QUIZ_REFERRAL_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { ref?: string | null };
  const refParam = body.ref?.trim().toLowerCase();
  const refFromBody = refParam === QUIZ_REFERRAL_CHALLENGE ? QUIZ_REFERRAL_CHALLENGE : null;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const refFromCookie = readCookie(cookieHeader, QUIZ_REFERRAL_COOKIE_NAME);
  const referral =
    refFromBody ??
    (refFromCookie?.toLowerCase() === QUIZ_REFERRAL_CHALLENGE ? QUIZ_REFERRAL_CHALLENGE : null);

  const access = await resolveQuizSessionForPage();

  if (access?.userId) {
    const started = await createQuizAttemptForLoggedInUser(access, {
      quizReferralSource: referral,
    });
    const response = NextResponse.json({
      attemptId: started.attemptId,
      firstName: started.firstName,
      role: started.role,
      questions: started.questions,
    });
    response.cookies.set(QUIZ_ATTEMPT_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    appendQuizReferralCookie(response, refFromBody);
    return response;
  }

  const { attemptId, questions } = await createAnonymousQuizAttempt({
    quizReferralSource: referral,
  });
  const response = NextResponse.json({
    attemptId,
    questions,
  });
  appendQuizAttemptCookie(response, attemptId);
  appendQuizReferralCookie(response, refFromBody);
  return response;
}
