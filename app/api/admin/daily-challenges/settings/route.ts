import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { updateDailyChallengeSettings } from "@/lib/daily-challenge-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as {
    pushHourChicago?: number;
    pushMinuteChicago?: number;
  };

  const hour = Number(body.pushHourChicago);
  const minute = Number(body.pushMinuteChicago);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return jsonNoStore({ error: "pushHourChicago must be 0-23." }, { status: 400 });
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return jsonNoStore({ error: "pushMinuteChicago must be 0-59." }, { status: 400 });
  }

  const settings = await updateDailyChallengeSettings({
    pushHourChicago: hour,
    pushMinuteChicago: minute,
  });

  return jsonNoStore({
    settings: {
      pushHourChicago: settings.pushHourChicago,
      pushMinuteChicago: settings.pushMinuteChicago,
    },
  });
}
