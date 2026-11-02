import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMemberPdfHandoffSearchParams } from "@/lib/member-pdf-handoff-params-server";
import { mintMemberPdfGoUrl } from "@/lib/member-pdf-mint-server";
import { sessionIsAdmin } from "@/lib/my-resources-view-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = parseMemberPdfHandoffSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return NextResponse.json({ error: "Invalid PDF request." }, { status: 400 });
  }

  const goUrl = await mintMemberPdfGoUrl({
    userId: session.user.id,
    email: session.user.email ?? "",
    isAdmin: sessionIsAdmin(session.user.email),
    ...params,
  });

  if (!goUrl) {
    return NextResponse.json({ error: "PDF not available." }, { status: 403 });
  }

  return NextResponse.json({ goUrl });
}
