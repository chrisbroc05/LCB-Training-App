import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  listDistinctWaiverTeamNames,
  listUnifiedAgreements,
  resolveTeamSlugFilter,
} from "@/lib/admin-agreements-server";
import type { AgreementSourceFilter } from "@/lib/admin-agreements-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const source = (url.searchParams.get("source")?.trim() ?? "all") as AgreementSourceFilter;
  const teamSlug = resolveTeamSlugFilter(team);

  const [agreements, teams] = await Promise.all([
    listUnifiedAgreements({
      teamSlug,
      search: search || undefined,
      source,
    }),
    listDistinctWaiverTeamNames(),
  ]);

  return jsonNoStore({
    agreements,
    teams,
    count: agreements.length,
  });
}
