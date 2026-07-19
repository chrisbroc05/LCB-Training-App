import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import GoalSettingForm from "@/app/goal-setting/GoalSettingForm";
import GoalHistorySection from "@/app/goal-setting/GoalHistorySection";
import {
  formatGoalFocusAreaLabel,
  getGoalCheckinAvailability,
} from "@/lib/goal-check-in";
import { canAccessCoachingNav } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function GoalSettingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user) {
    redirect("/auth");
  }

  if (!canAccessCoachingNav(user.membershipTier)) {
    return (
      <LockedFeaturePanel
        title="Monthly Goal Check-In"
        description="Submit your monthly goals and get personal feedback from Coach Broc."
        message="Monthly goal check-ins are available on Memorable and Elite memberships. Upgrade to Memorable for 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support."
        upgradeLabel="Upgrade to Memorable"
        upgradeHref="/upgrade?reason=memorable-required"
      />
    );
  }

  const availability = await getGoalCheckinAvailability(session.user.id);
  const submissionHistory = await prisma.goalCheckin.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const historyEntries = submissionHistory.map((submission) => ({
    id: submission.id,
    createdAt: submission.createdAt.toISOString(),
    monthlyFocus: submission.monthlyFocus,
    lastMonthReview: submission.lastMonthReview,
    focusAreaLabel: formatGoalFocusAreaLabel(submission.focusArea),
    additionalNotes: submission.additionalNotes,
    coachResponse: submission.coachResponse,
    status: submission.status,
    respondedAt: submission.respondedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Monthly Goal Check-In
        </h1>
        <p className="mt-2 text-zinc-300">
          Submit your monthly goals and Coach Broc will personally review them and respond within 48
          hours.
        </p>

        {availability.canSubmit ? (
          <GoalSettingForm />
        ) : (
          <p className="mt-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {availability.message}
          </p>
        )}
      </section>

      <GoalHistorySection entries={historyEntries} />
    </div>
  );
}
