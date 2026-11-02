import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

export type MemberPdfHandoffParams = {
  kind: MemberPdfViewKind;
  file?: string;
  token?: string;
  resource?: string;
  fixitToken?: string;
  submissionId?: string;
  download: boolean;
};

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

export function parseMemberPdfRouteSearchParams(
  searchParams: URLSearchParams,
): MemberPdfHandoffParams | null {
  const kind = readKind(searchParams.get("kind"));
  if (!kind) {
    return null;
  }

  return {
    kind,
    file: searchParams.get("file")?.trim() || undefined,
    token: searchParams.get("token")?.trim() || undefined,
    resource: searchParams.get("resource")?.trim() || undefined,
    fixitToken: searchParams.get("fixitToken")?.trim() || undefined,
    submissionId: searchParams.get("submissionId")?.trim() || undefined,
    download: searchParams.get("download") === "1",
  };
}
