import Link from "next/link";
import { canAccessPlaybook } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import { PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL } from "@/lib/membership-levels-shared";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";
import { prisma } from "@/lib/prisma";

type DashboardPlaybookProgressCardProps = {
  userId: string;
  className?: string;
  showForEnrolled?: boolean;
};

export default async function DashboardPlaybookProgressCard({
  userId,
  className = "",
  showForEnrolled = false,
}: DashboardPlaybookProgressCardProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  const access = user
    ? toAccessUserFields(user)
    : toAccessUserFields(emptyAccessUserRow);
  const visibilityClass = showForEnrolled ? "" : "md:hidden";
  const articleClassName = ["rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6", visibilityClass, className]
    .filter(Boolean)
    .join(" ");

  if (
    !canAccessPlaybook(
      access.membershipTier,
      access.playbookLegacyAccess,
      access.membershipLevel,
      access.membershipLevelExpiresAt,
    )
  ) {
    return (
      <article className={articleClassName}>
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">The Next Level Playbook</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} The Playbook is included with Plus and above.
        </p>
        <Link
          href="/playbook"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Unlock The Playbook
        </Link>
      </article>
    );
  }

  const progressRecord = await ensurePlaybookProgress(userId);
  const progress = serializePlaybookProgress(progressRecord);
  const hasStarted = progress.chapters.some(
    (chapter) => chapter.status === "in_progress" || chapter.status === "complete",
  );

  return (
    <article className={articleClassName}>
      <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Playbook Progress</h2>
      <div className="mt-3 flex items-center justify-between text-sm text-zinc-300">
        <span>
          {progress.completedCount} of {progress.totalCount} chapters complete
        </span>
        <span>{progress.percentComplete}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#0A1628]">
        <div
          className="h-full rounded-full bg-[#52B788] transition-all"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      <div className="mt-4 space-y-2">
        {progress.chapters.map((chapter) => (
          <div
            key={chapter.chapterNumber}
            className="flex items-center justify-between rounded-lg border border-[#2b3650] bg-black/30 px-3 py-2 text-sm"
          >
            <span className="text-zinc-200">
              Ch {chapter.chapterNumber}: {chapter.chapterTitle}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#98b144]">
              {chapter.status === "complete"
                ? "Done"
                : chapter.status === "in_progress"
                  ? "Started"
                  : "Not started"}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/playbook"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
      >
        {hasStarted ? "Continue Reading" : "Begin Chapter 1"}
      </Link>
    </article>
  );
}
