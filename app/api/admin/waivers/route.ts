import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  listWaiverSignatures,
  serializeWaiverSignature,
} from "@/lib/waiver-sign-server";
import { normalizeTeamSlug } from "@/lib/waiver-sign-shared";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const teamSlug = team ? normalizeTeamSlug(team) : undefined;

  const signatures = await listWaiverSignatures({
    teamSlug,
    search: search || undefined,
  });

  return jsonNoStore({
    signatures: signatures.map(serializeWaiverSignature),
    count: signatures.length,
  });
}
