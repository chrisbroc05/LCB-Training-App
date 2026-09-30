import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildWaiverCsv,
  listWaiverSignatures,
  serializeWaiverSignature,
} from "@/lib/waiver-sign-server";
import { normalizeTeamSlug } from "@/lib/waiver-sign-shared";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const teamSlug = team ? normalizeTeamSlug(team) : undefined;

  const signatures = await listWaiverSignatures({
    teamSlug,
    search: search || undefined,
  });

  const csv = buildWaiverCsv(signatures.map(serializeWaiverSignature));

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="waiver-signatures.csv"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
