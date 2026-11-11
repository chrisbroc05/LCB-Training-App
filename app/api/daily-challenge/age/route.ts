import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  loadDailyChallengeContentForUser,
  loadDailyLeaderboardForUser,
  setPlayerAgeForDailyChallenge,
} from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { age?: number };
  const result = await setPlayerAgeForDailyChallenge(session.user.id, Number(body.age));
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  const [content, leaderboard] = await Promise.all([
    loadDailyChallengeContentForUser(session.user.id),
    loadDailyLeaderboardForUser(session.user.id),
  ]);

  return jsonNoStore({ ok: true, content, leaderboard });
}
