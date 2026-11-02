import "server-only";

import type { MemberPdfViewKind } from "@/lib/my-resources-shared";
import { createMemberPdfOpenToken } from "@/lib/member-pdf-open-token-shared";
import { buildMemberPdfGoPath } from "@/lib/member-pdf-open-shared";
import {
  resolvePdfViewerForSession,
  sessionIsAdmin,
} from "@/lib/my-resources-view-server";

export type MemberPdfMintParams = {
  userId: string;
  email: string;
  isAdmin: boolean;
  kind: MemberPdfViewKind;
  file?: string | null;
  token?: string | null;
  resource?: string | null;
  fixitToken?: string | null;
  submissionId?: string | null;
  download: boolean;
};

export async function mintMemberPdfGoUrl(params: MemberPdfMintParams): Promise<string | null> {
  const resolved = await resolvePdfViewerForSession({
    userId: params.userId,
    email: params.email,
    isAdmin: params.isAdmin,
    kind: params.kind,
    file: params.file,
    token: params.token,
    resource: params.resource,
    fixitToken: params.fixitToken,
    submissionId: params.submissionId,
  });

  if (!resolved) {
    return null;
  }

  const openToken = createMemberPdfOpenToken({
    uid: params.userId,
    kind: params.kind,
    file: params.file?.trim() || undefined,
    purchaseToken: params.kind === "purchase" ? params.token?.trim() : undefined,
    fixitResource: params.kind === "fixit" ? params.resource?.trim() : undefined,
    fixitToken: params.kind === "fixit" ? params.fixitToken?.trim() : undefined,
    submissionId: params.kind === "evaluation" ? params.submissionId?.trim() : undefined,
    download: params.download,
  });

  return buildMemberPdfGoPath(openToken);
}
