import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  loadDailyChallengeContentForUser,
  loadDailyLeaderboardForUser,
  markDailyChallengeDone,
} from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await markDailyChallengeDone(session.user.id);
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  const [content, leaderboard] = await Promise.all([
    loadDailyChallengeContentForUser(session.user.id),
    loadDailyLeaderboardForUser(session.user.id),
  ]);

  return jsonNoStore({ ok: true, alreadyDone: result.alreadyDone, content, leaderboard });
}
