import type { DailyChallengeAgeGroup } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  deleteAdminDailyChallenge,
  upsertAdminDailyChallenge,
} from "@/lib/daily-challenge-server";
import { isDailyChallengeAgeGroup } from "@/lib/daily-challenge-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as {
    id?: string;
    ageGroup?: string;
    rotationDay?: number;
    title?: string;
    instructions?: string;
    drillLibraryVimeoId?: string | null;
    active?: boolean;
  };

  if (!body.ageGroup || !isDailyChallengeAgeGroup(body.ageGroup)) {
    return jsonNoStore({ error: "Invalid age group." }, { status: 400 });
  }

  const result = await upsertAdminDailyChallenge({
    id: body.id,
    ageGroup: body.ageGroup as DailyChallengeAgeGroup,
    rotationDay: Number(body.rotationDay),
    title: body.title ?? "",
    instructions: body.instructions ?? "",
    drillLibraryVimeoId: body.drillLibraryVimeoId,
    active: body.active,
  });

  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  return jsonNoStore({ challenge: result.row });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return jsonNoStore({ error: "id is required." }, { status: 400 });
  }

  await deleteAdminDailyChallenge(body.id);
  return jsonNoStore({ ok: true });
}
