import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMemberPdfOpenToken } from "@/lib/member-pdf-open-token-shared";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";
import {
  resolvePdfViewerForSession,
  sessionIsAdmin,
} from "@/lib/my-resources-view-server";

function readKind(value: string | null): MemberPdfViewKind | null {
  if (
    value === "workout" ||
    value === "guide" ||
    value === "purchase" ||
    value === "fixit" ||
    value === "evaluation"
  ) {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = readKind(url.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Invalid PDF kind." }, { status: 400 });
  }

  const download = url.searchParams.get("download") === "1";

  const resolved = await resolvePdfViewerForSession({
    userId: session.user.id,
    email: session.user.email ?? "",
    isAdmin: sessionIsAdmin(session.user.email),
    kind,
    file: url.searchParams.get("file"),
    token: url.searchParams.get("token"),
    resource: url.searchParams.get("resource"),
    fixitToken: url.searchParams.get("fixitToken"),
    submissionId: url.searchParams.get("submissionId"),
  });

  if (!resolved) {
    return NextResponse.json({ error: "PDF not available." }, { status: 403 });
  }

  const openToken = createMemberPdfOpenToken({
    uid: session.user.id,
    kind,
    file: url.searchParams.get("file")?.trim() || undefined,
    purchaseToken: kind === "purchase" ? url.searchParams.get("token")?.trim() : undefined,
    fixitResource: kind === "fixit" ? url.searchParams.get("resource")?.trim() : undefined,
    fixitToken: kind === "fixit" ? url.searchParams.get("fixitToken")?.trim() : undefined,
    submissionId:
      kind === "evaluation" ? url.searchParams.get("submissionId")?.trim() : undefined,
    download,
  });

  const inlineUrl = new URL("/api/member/pdf/inline", url.origin);
  inlineUrl.searchParams.set("token", openToken);
  return NextResponse.redirect(inlineUrl);
}
