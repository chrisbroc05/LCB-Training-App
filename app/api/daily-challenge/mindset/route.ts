import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  loadDailyChallengeContentForUser,
  submitDailyMindsetAnswer,
} from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { answer?: string };
  const result = await submitDailyMindsetAnswer(session.user.id, body.answer ?? "");
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  const content = await loadDailyChallengeContentForUser(session.user.id);
  return jsonNoStore({ ...result, content });
}
