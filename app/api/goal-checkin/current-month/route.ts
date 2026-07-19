import { NextResponse } from "next/server";
import { serializeGoalItem } from "@/lib/goal-check-in-constants";
import { getGoalCheckinAvailability } from "@/lib/goal-check-in";
import { requireGoalCheckinMember } from "@/lib/goal-checkin-api";

export async function GET() {
  const access = await requireGoalCheckinMember();
  if (access.error) {
    return access.error;
  }

  const availability = await getGoalCheckinAvailability(access.session.user.id);

  return NextResponse.json({
    canSubmit: availability.canSubmit,
    message: availability.message,
    currentSubmission: availability.currentSubmission
      ? {
          id: availability.currentSubmission.id,
          status: availability.currentSubmission.status,
          createdAt: availability.currentSubmission.createdAt.toISOString(),
          goals: availability.currentSubmission.goals.map(serializeGoalItem),
        }
      : null,
  });
}
