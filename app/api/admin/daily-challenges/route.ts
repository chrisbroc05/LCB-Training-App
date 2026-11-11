import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getDailyChallengeSettings,
  listAdminDailyChallenges,
  listAdminDailyQuestions,
} from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const [challenges, questions, settings] = await Promise.all([
    listAdminDailyChallenges(),
    listAdminDailyQuestions(),
    getDailyChallengeSettings(),
  ]);

  return jsonNoStore({
    challenges,
    questions,
    settings: {
      pushHourChicago: settings.pushHourChicago,
      pushMinuteChicago: settings.pushMinuteChicago,
    },
  });
}
