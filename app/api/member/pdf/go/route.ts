import { NextResponse } from "next/server";
import { verifyMemberPdfOpenToken } from "@/lib/member-pdf-open-token-shared";
import { streamMemberPdfFromOpenToken } from "@/lib/member-pdf-stream-server";
import { buildMemberPdfUnavailablePath } from "@/lib/member-pdf-unavailable-shared";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const payload = verifyMemberPdfOpenToken(token);
  if (!payload) {
    return NextResponse.redirect(buildMemberPdfUnavailablePath("expired"));
  }

  try {
    const response = await streamMemberPdfFromOpenToken(payload);
    if (!response) {
      return NextResponse.redirect(buildMemberPdfUnavailablePath("missing"));
    }
    return response;
  } catch {
    return NextResponse.redirect(buildMemberPdfUnavailablePath("error"));
  }
}
