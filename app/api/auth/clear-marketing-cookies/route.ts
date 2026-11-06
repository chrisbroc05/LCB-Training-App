import { NextResponse } from "next/server";
import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import { QUIZ_ATTEMPT_COOKIE_NAME, QUIZ_REFERRAL_COOKIE_NAME } from "@/lib/quiz-session-cookies";

/** Clears httpOnly-light marketing cookies on logout (lead id, quiz attempt binding). */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  const clearOpts = {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  const clearHttpOnly = {
    ...clearOpts,
    httpOnly: true as const,
  };
  response.cookies.set(LEAD_COOKIE_NAME, "", clearOpts);
  response.cookies.set(QUIZ_ATTEMPT_COOKIE_NAME, "", clearHttpOnly);
  response.cookies.set(QUIZ_REFERRAL_COOKIE_NAME, "", clearHttpOnly);
  return response;
}
