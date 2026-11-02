import { NextResponse } from "next/server";
import { verifyMemberPdfOpenToken } from "@/lib/member-pdf-open-token-shared";
import { streamMemberPdfFromOpenToken } from "@/lib/member-pdf-stream-server";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const payload = verifyMemberPdfOpenToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired PDF link." }, { status: 403 });
  }

  const response = await streamMemberPdfFromOpenToken(payload);
  if (!response) {
    return NextResponse.json({ error: "PDF not found." }, { status: 404 });
  }

  return response;
}
