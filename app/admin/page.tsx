import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { buildAdminProgramOverview } from "@/lib/admin-program-overview";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/app/admin/AdminPanel";
import FreeMembersSection from "@/app/admin/FreeMembersSection";
import TwelveWeekPlayersSection from "@/app/admin/TwelveWeekPlayersSection";
import AdminMessagesNavLink from "@/components/AdminMessagesNavLink";
import SignOutButton from "@/app/components/SignOutButton";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const programOverview = await buildAdminProgramOverview();
  const activePlayerCount = programOverview.players.length;
  const goneQuietCount = programOverview.players.filter((player) => player.goneQuiet).length;

  const freeMembers = await prisma.user.findMany({
    where: { membershipTier: "FREE" },
    select: {
      id: true,
      name: true,
      email: true,
      signupDate: true,
      assessmentCallBooked: true,
      assessmentCallDate: true,
    },
    orderBy: { signupDate: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="mb-8 rounded-3xl border-2 border-[#52B788]/50 bg-[#0b1324]/90 p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">12-Week Program</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {activePlayerCount} active player{activePlayerCount === 1 ? "" : "s"}
              {goneQuietCount > 0
                ? ` . ${goneQuietCount} gone quiet`
                : " . everyone checked in recently"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/program"
              className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-[#0A1628]"
            >
              Program overview
            </Link>
            <AdminMessagesNavLink />
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Signed waivers</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Lesson and team players who signed outside the app.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign"
              target="_blank"
              className="inline-flex rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
            >
              Open /sign
            </Link>
            <Link
              href="/admin/waivers"
              className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628]"
            >
              View waivers
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Admin Submissions Inbox</h1>
        <p className="mt-2 text-zinc-300">
          Review coaching submissions and goal check-ins, then send responses.
        </p>
        <Suspense fallback={<p className="text-zinc-400">Loading submissions...</p>}>
          <AdminPanel />
        </Suspense>
      </section>

      <TwelveWeekPlayersSection />

      <FreeMembersSection
        initialMembers={freeMembers.map((member) => ({
          ...member,
          signupDate: member.signupDate.toISOString(),
          assessmentCallDate: member.assessmentCallDate?.toISOString() ?? null,
        }))}
      />

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
