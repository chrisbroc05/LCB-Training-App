import type { DailyChallengeAgeGroup, DailyQuestionType } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  deleteAdminDailyQuestion,
  upsertAdminDailyQuestion,
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
    ageGroup?: string | null;
    rotationDay?: number;
    type?: string;
    prompt?: string;
    options?: string[];
    correctOptionIndex?: number | null;
    explanation?: string | null;
    active?: boolean;
  };

  if (body.type !== "TRIVIA" && body.type !== "MINDSET") {
    return jsonNoStore({ error: "type must be TRIVIA or MINDSET." }, { status: 400 });
  }

  let ageGroup: DailyChallengeAgeGroup | null = null;
  if (body.ageGroup && body.ageGroup !== "all") {
    if (!isDailyChallengeAgeGroup(body.ageGroup)) {
      return jsonNoStore({ error: "Invalid age group." }, { status: 400 });
    }
    ageGroup = body.ageGroup as DailyChallengeAgeGroup;
  }

  const result = await upsertAdminDailyQuestion({
    id: body.id,
    ageGroup,
    rotationDay: Number(body.rotationDay),
    type: body.type as DailyQuestionType,
    prompt: body.prompt ?? "",
    options: body.options,
    correctOptionIndex: body.correctOptionIndex,
    explanation: body.explanation,
    active: body.active,
  });

  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: 400 });
  }

  return jsonNoStore({ question: result.row });
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

  await deleteAdminDailyQuestion(body.id);
  return jsonNoStore({ ok: true });
}
