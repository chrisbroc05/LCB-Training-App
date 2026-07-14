import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import MentalGameForm from "@/app/mental-game/MentalGameForm";
import {
  canSubmitCoachingForms,
  getCoachingSubmissionLockReason,
  type DatabaseTier,
} from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export default async function MentalGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }
  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { freeSubmissionUsed: true, membershipTier: true },
  });
  const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;
  const freeSubmissionUsed = user?.freeSubmissionUsed ?? false;
  const lockReason = getCoachingSubmissionLockReason(membershipTier, freeSubmissionUsed);

  if (lockReason === "basic") {
    return (
      <LockedFeaturePanel
        title="Mental Game Support"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message="Mental game support submissions are available on Pro and Elite memberships. Basic members have full drill library and workout program access, but coaching submissions require an upgrade."
        upgradeLabel="Upgrade to Pro or Elite"
        upgradeHref="/upgrade?reason=pro-required"
      />
    );
  }

  if (lockReason === "free-used") {
    return (
      <LockedFeaturePanel
        title="Mental Game Support"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message="Your one free submission has already been used. Upgrade to Pro or Elite for unlimited swing analysis and mental game support submissions."
        upgradeLabel="Upgrade to Pro or Elite"
        upgradeHref="/upgrade?reason=free-submission-used"
      />
    );
  }

  if (!canSubmitCoachingForms(membershipTier, freeSubmissionUsed)) {
    redirect("/upgrade");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Mental Game Support</h1>
        <p className="mt-2 text-zinc-300">
          Submit what you are dealing with mentally so your coach can send support and adjustments.
        </p>

        <MentalGameForm />
      </section>
    </div>
  );
}
