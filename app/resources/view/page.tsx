import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

const REDIRECT_KINDS: MemberPdfViewKind[] = [
  "workout",
  "guide",
  "purchase",
  "fixit",
  "evaluation",
];

/** Legacy bookmarks: send members through the signed native PDF open flow. */
export default async function ResourcePdfViewPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=/resources");
  }

  const params = await searchParams;
  const kind = readParam(params, "kind") as MemberPdfViewKind | null;
  if (!kind || !REDIRECT_KINDS.includes(kind)) {
    notFound();
  }

  const open = new URLSearchParams();
  open.set("kind", kind);
  for (const key of ["file", "token", "resource", "fixitToken", "submissionId"] as const) {
    const value = readParam(params, key);
    if (value) {
      open.set(key, value);
    }
  }

  redirect(`/api/member/pdf/open?${open.toString()}`);
}
