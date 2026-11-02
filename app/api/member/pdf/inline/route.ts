import { NextResponse } from "next/server";

/** Legacy alias: inline hop merged into /api/member/pdf/go. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  return NextResponse.redirect(`/api/member/pdf/go?token=${encodeURIComponent(token)}`);
}
