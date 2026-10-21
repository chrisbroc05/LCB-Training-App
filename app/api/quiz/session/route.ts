import { NextResponse } from "next/server";
import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import { resolveQuizAccessReadonly } from "@/lib/player-iq-quiz-server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${LEAD_COOKIE_NAME}=([^;]*)`));
  const leadIdFromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;

  const access = await resolveQuizAccessReadonly({ leadIdFromCookie });
  if (!access || (!access.leadId && !access.userId)) {
    return NextResponse.json({ hasAccess: false });
  }

  return NextResponse.json({
    hasAccess: true,
    firstName: access.firstName,
    role: access.role,
  });
}
