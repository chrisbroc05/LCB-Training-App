import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  loadDailyChallengeContentForUser,
  loadDailyLeaderboardForUser,
} from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const [content, leaderboard] = await Promise.all([
    loadDailyChallengeContentForUser(session.user.id),
    loadDailyLeaderboardForUser(session.user.id),
  ]);

  if (!content) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  return jsonNoStore({ content, leaderboard });
}
