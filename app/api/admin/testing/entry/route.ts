import { requireAdminTestingSession } from "@/lib/admin-testing-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getOrCreateSessionForDate,
  getStationEntryData,
  ensureTestTeamBySlug,
} from "@/lib/testing-server";
import { normalizeTestSessionDateKey } from "@/lib/testing-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminTestingSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const teamSlug = url.searchParams.get("teamSlug")?.trim();
    const date = normalizeTestSessionDateKey(url.searchParams.get("date"));
    const stationKey = url.searchParams.get("stationKey")?.trim();

    if (!teamSlug || !stationKey) {
      return jsonNoStore({ error: "teamSlug and stationKey are required." }, { status: 400 });
    }

    const team = await ensureTestTeamBySlug(teamSlug, teamSlug);
    const session = await getOrCreateSessionForDate(team.id, date);
    const entry = await getStationEntryData(session.id, stationKey);

    if (!entry) {
      return jsonNoStore(
        {
          error:
            "That test station is not configured or was renamed. Pick another station in the sidebar.",
        },
        { status: 404 },
      );
    }

    return jsonNoStore(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load testing entry.";
    return jsonNoStore({ error: message }, { status: 500 });
  }
}
