import { NextResponse } from "next/server";
import { resolveResourceEmailDownloadRedirect } from "@/lib/resource-email-download-server";
import { buildAppRedirectUrl } from "@/lib/request-base-url-shared";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.redirect(buildAppRedirectUrl(request, "/resources/download/recover"));
  }

  const result = await resolveResourceEmailDownloadRedirect(token);
  if (!result.ok) {
    if (result.kind === "refunded") {
      return NextResponse.redirect(
        buildAppRedirectUrl(request, "/resources/download/refunded", {
          resource: result.resourceSlug ?? "",
        }),
      );
    }
    return NextResponse.redirect(
      buildAppRedirectUrl(request, "/resources/download/recover", {
        resource: result.resourceSlug ?? "",
      }),
    );
  }

  return NextResponse.redirect(new URL(result.redirectPath, request.url));
}
