import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  listUnifiedAgreements,
  resolveTeamSlugFilter,
} from "@/lib/admin-agreements-server";
import type { AgreementSourceFilter } from "@/lib/admin-agreements-shared";

export { dynamic, revalidate } from "@/lib/api-no-store";

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

  const agreements = await listUnifiedAgreements({
    teamSlug,
    search: search || undefined,
    source,
  });

  return jsonNoStore({
    agreements,
    count: agreements.length,
  });
}
