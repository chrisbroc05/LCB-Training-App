import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AccountSummaryCard from "@/app/profile/AccountSummaryCard";
import AssessmentCallCard from "@/app/profile/AssessmentCallCard";
import CoachingSubmissionHistory, {
  type ProfileSubmission,
} from "@/app/profile/CoachingSubmissionHistory";
import PlayerProfileCard from "@/app/profile/PlayerProfileCard";
import PlaybookProgressCard from "@/app/profile/PlaybookProgressCard";
import ProfileGoalCheckinHistory from "@/app/profile/ProfileGoalCheckinHistory";
import { profilePageStackClass, profilePageTitleClass } from "@/app/profile/profile-styles";
import { authOptions } from "@/lib/auth";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
} from "@/lib/coaching-submissions";
import {
  canAccessCoachingNav,
  canAccessPlaybook,
  isLifetimeBasicMember,
  type DatabaseTier,
} from "@/lib/membership";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedTypeParam =
    typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type.toUpperCase() : "";
  const selectedIdParam = typeof resolvedSearchParams.id === "string" ? resolvedSearchParams.id : "";

  const [user, swingSubmissions, mentalSubmissions, coachingFields] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        membershipTier: true,
        signupDate: true,
        stripeSubscriptionId: true,
        assessmentCallBooked: true,
        assessmentCallDate: true,
      },
    }),
    prisma.swingAnalysisSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    ensureCoachingSubmissionPeriod(session.user.id),
  ]);

  if (!user) {
    redirect("/auth");
  }

  const membershipTier = user.membershipTier as DatabaseTier;
  const merged: ProfileSubmission[] = [
    ...swingSubmissions.map((item) => ({
      id: item.id,
      type: "SWING" as const,
      createdAt: item.createdAt,
      status: item.status,
      playerName: item.playerName,
      originalMessage: item.notes,
      originalVideoUrl: item.submittedVideo,
      memberVimeoLink: item.memberVimeoLink,
      responseText: item.responseText,
      responseVideoUrl: item.responseVideoUrl,
      extraLines: [`Pitch Focus: ${item.pitchType}`, `Handedness: ${item.handedness}`],
    })),
    ...mentalSubmissions.map((item) => ({
      id: item.id,
      type: "MENTAL" as const,
      createdAt: item.createdAt,
      status: item.status,
      playerName: item.playerName,
      originalMessage: item.message,
      originalVideoUrl: item.videoPath,
      memberVimeoLink: item.memberVimeoLink,
      responseText: item.responseText,
      responseVideoUrl: item.responseVideoUrl,
      extraLines: [`Topic: ${item.topic}`, `Age: ${item.playerAge}`],
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const selectedSubmission =
    merged.find(
      (item) =>
        item.id === selectedIdParam && item.type === (selectedTypeParam === "MENTAL" ? "MENTAL" : "SWING"),
    ) ?? merged[0];

  const availability = coachingFields
    ? getCoachingSubmissionAvailability(coachingFields)
    : null;
  const submissionsRemaining =
    membershipTier === "MEMORABLE" || membershipTier === "ELITE"
      ? (availability?.remaining ?? 0)
      : null;
  const showLifetimeAccess = isLifetimeBasicMember(membershipTier, user.stripeSubscriptionId);

  let playbookProgress = null;
  if (canAccessPlaybook(membershipTier)) {
    const progress = await ensurePlaybookProgress(session.user.id);
    playbookProgress = serializePlaybookProgress(progress);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <div className={profilePageStackClass}>
        <section className="rounded-xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h1 className={profilePageTitleClass}>My Profile</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Your personal dashboard for account details, training progress, and coaching history.
          </p>
        </section>

        <AccountSummaryCard
          name={user.name}
          email={user.email}
          membershipTier={membershipTier}
          memberSince={formatDate(user.signupDate)}
          submissionsRemaining={submissionsRemaining}
          showLifetimeAccess={showLifetimeAccess}
        />

        <PlayerProfileCard />

        {playbookProgress ? <PlaybookProgressCard progress={playbookProgress} /> : null}

        <CoachingSubmissionHistory
          submissions={merged}
          selectedSubmission={selectedSubmission ?? null}
        />

        <ProfileGoalCheckinHistory hasAccess={canAccessCoachingNav(membershipTier)} />

        {membershipTier === "FREE" ? (
          <AssessmentCallCard
            assessmentCallBooked={user.assessmentCallBooked}
            assessmentCallDate={user.assessmentCallDate}
          />
        ) : null}
      </div>
    </div>
  );
}
