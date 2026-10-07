import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore, dynamic, revalidate } from "@/lib/api-no-store";
import { getOrCreateSessionForDate, getStationEntryData, ensureTestTeamBySlug } from "@/lib/testing-server";

export { dynamic, revalidate };

export async function GET(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const teamSlug = url.searchParams.get("teamSlug")?.trim();
  const date = url.searchParams.get("date")?.trim() || new Date().toISOString().slice(0, 10);
  const stationKey = url.searchParams.get("stationKey")?.trim();

  if (!teamSlug || !stationKey) {
    return jsonNoStore({ error: "teamSlug and stationKey are required." }, { status: 400 });
  }

  const team = await ensureTestTeamBySlug(teamSlug, teamSlug);
  const session = await getOrCreateSessionForDate(team.id, date);
  const entry = await getStationEntryData(session.id, stationKey);

  if (!entry) {
    return jsonNoStore({ error: "Entry data not found." }, { status: 404 });
  }

  return jsonNoStore(entry);
}
