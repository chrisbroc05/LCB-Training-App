import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildUnifiedAgreementsCsv,
  listUnifiedAgreements,
  resolveTeamSlugFilter,
} from "@/lib/admin-agreements-server";
import type { AgreementSourceFilter } from "@/lib/admin-agreements-shared";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const source = (url.searchParams.get("source")?.trim() ?? "all") as AgreementSourceFilter;
  const teamSlug = resolveTeamSlugFilter(team);

  const agreements = await listUnifiedAgreements({
    teamSlug,
    search: search || undefined,
    source,
  });

  const csv = buildUnifiedAgreementsCsv(agreements);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="signed-agreements.csv"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
