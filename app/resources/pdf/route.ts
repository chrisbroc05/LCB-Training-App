import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deliverMemberPdf } from "@/lib/member-pdf-deliver-server";
import { parseMemberPdfRouteSearchParams } from "@/lib/member-pdf-route-params-shared";
import {
  buildMemberPdfUnavailablePath,
  type MemberPdfUnavailableCode,
} from "@/lib/member-pdf-unavailable-shared";
import {
  resolvePdfViewerForSession,
  sessionIsAdmin,
} from "@/lib/my-resources-view-server";

function redirectToUnavailable(request: Request, code: MemberPdfUnavailableCode) {
  return NextResponse.redirect(new URL(buildMemberPdfUnavailablePath(code), request.url));
}

/** Same-tab member PDF open/download: session check, then inline PDF or R2 redirect (evaluations). */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirectToUnavailable(request, "sign-in");
  }

  const params = parseMemberPdfRouteSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return redirectToUnavailable(request, "invalid");
  }

  const allowed = await resolvePdfViewerForSession({
    userId: session.user.id,
    email: session.user.email ?? "",
    isAdmin: sessionIsAdmin(session.user.email),
    kind: params.kind,
    file: params.file,
    token: params.token,
    resource: params.resource,
    fixitToken: params.fixitToken,
    submissionId: params.submissionId,
  });

  if (!allowed) {
    return redirectToUnavailable(request, "forbidden");
  }

  const delivered = await deliverMemberPdf({
    ...params,
    userId: session.user.id,
    email: session.user.email ?? "",
  });

  if (!delivered.ok) {
    return redirectToUnavailable(request, delivered.code);
  }

  return delivered.response;
}
