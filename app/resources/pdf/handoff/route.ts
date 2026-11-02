import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMemberPdfHandoffSearchParams } from "@/lib/member-pdf-handoff-params-server";
import { mintMemberPdfGoUrl } from "@/lib/member-pdf-mint-server";
import { buildMemberPdfUnavailablePath } from "@/lib/member-pdf-unavailable-shared";
import { sessionIsAdmin } from "@/lib/my-resources-view-server";

/** Mint a signed go URL while the member is signed in, then redirect (no session on go). */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(buildMemberPdfUnavailablePath("sign-in"));
  }

  const params = parseMemberPdfHandoffSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return NextResponse.redirect(buildMemberPdfUnavailablePath("invalid"));
  }

  const goUrl = await mintMemberPdfGoUrl({
    userId: session.user.id,
    email: session.user.email ?? "",
    isAdmin: sessionIsAdmin(session.user.email),
    ...params,
  });

  if (!goUrl) {
    return NextResponse.redirect(buildMemberPdfUnavailablePath("forbidden"));
  }

  return NextResponse.redirect(goUrl);
}
