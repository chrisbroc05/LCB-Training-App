import { NextResponse } from "next/server";
import { resolveQuizSessionForPage } from "@/lib/player-iq-quiz-server";
import { buildQuizSessionJson } from "@/lib/quiz-session-response-shared";

/** Personalized session for /quiz (logged-in only). Anonymous users never get a name from lead cookies. */
export async function GET() {
  const access = await resolveQuizSessionForPage();
  return NextResponse.json(buildQuizSessionJson(access));
}
