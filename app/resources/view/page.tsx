import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import PdfResourceViewerClient from "@/app/resources/view/PdfResourceViewerClient";
import { authOptions } from "@/lib/auth";
import type { MemberPdfViewKind } from "@/lib/my-resources-shared";
import { parseResourcesTabParam } from "@/lib/my-resources-shared";
import {
  resolvePdfViewerForSession,
  sessionIsAdmin,
} from "@/lib/my-resources-view-server";

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

export default async function ResourcePdfViewPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=/resources");
  }

  const params = await searchParams;
  const kind = readParam(params, "kind") as MemberPdfViewKind | null;
  if (!kind || !["workout", "guide", "purchase", "fixit"].includes(kind)) {
    notFound();
  }

  const email = session.user.email ?? "";
  const resolved = await resolvePdfViewerForSession({
    userId: session.user.id,
    email,
    isAdmin: sessionIsAdmin(session.user.email),
    kind,
    file: readParam(params, "file"),
    token: readParam(params, "token"),
    resource: readParam(params, "resource"),
    fixitToken: readParam(params, "fixitToken"),
  });

  if (!resolved) {
    notFound();
  }

  const backTab = parseResourcesTabParam(readParam(params, "fromTab"));
  const backHref =
    backTab === "mine" ? "/resources?tab=mine" : "/resources?tab=browse";

  return (
    <PdfResourceViewerClient
      title={resolved.title}
      pdfSrc={resolved.pdfSrc}
      downloadHref={resolved.downloadHref}
      backHref={backHref}
    />
  );
}
