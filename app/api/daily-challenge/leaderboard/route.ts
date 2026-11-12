import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { loadDailyLeaderboardForUser } from "@/lib/daily-challenge-server";
import {
  isDailyLeaderboardScopeFilter,
  type DailyLeaderboardScopeFilter,
} from "@/lib/daily-challenge-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scopeRaw = url.searchParams.get("scope") ?? "all";
  const scope: DailyLeaderboardScopeFilter = isDailyLeaderboardScopeFilter(scopeRaw)
    ? scopeRaw
    : "all";

  const summary = await loadDailyLeaderboardForUser(session.user.id, { scope });
  if (!summary) {
    return jsonNoStore({ error: "Set your age to see the leaderboard." }, { status: 400 });
  }

  return jsonNoStore({
    summary,
    entries: summary.entries,
  });
}
