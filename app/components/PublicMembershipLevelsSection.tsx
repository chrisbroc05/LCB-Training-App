import Link from "next/link";
import { getServerSession } from "next-auth";
import MembershipLevelCards from "@/app/components/MembershipLevelCards";
import { authOptions } from "@/lib/auth";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { activeMembershipLevel } from "@/lib/access-shared";
import { resolveMembershipFoundingPlusHighlight } from "@/lib/membership-comparison-shared";
import { listPublicMembershipLevelDefinitions } from "@/lib/membership-levels-shared";
import { isAllAccessCheckoutAvailable } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";
import { TWELVE_WEEK_PROGRAM_PRICE_LABEL } from "@/lib/twelve-week-program";

export default async function PublicMembershipLevelsSection() {
  const levels = listPublicMembershipLevelDefinitions();
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session?.user?.id);
  const allAccessAvailable =
    levels.length > 0 ? await isAllAccessCheckoutAvailable() : false;

  let currentLevel = null as ReturnType<typeof activeMembershipLevel>;
  let clubOrgName: string | null = null;
  let foundingPlusHighlight = null as ReturnType<
    typeof resolveMembershipFoundingPlusHighlight
  >;

  if (session?.user?.id && levels.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: userAccessSelect,
    });
    if (user) {
      const access = toAccessUserFields(user);
      currentLevel = activeMembershipLevel(access);
      clubOrgName = access.orgName?.trim() ?? null;
      foundingPlusHighlight = resolveMembershipFoundingPlusHighlight({
        signedIn: true,
        organizationId: access.organizationId,
        orgName: access.orgName,
        founding: user.organization
          ? {
              foundingOfferEnabled: user.organization.foundingOfferEnabled,
              foundingOfferDeadline: user.organization.foundingOfferDeadline,
              foundingOfferMonths: user.organization.foundingOfferMonths,
            }
          : null,
      });
    }
  }

  return (
    <section id="plans" className="scroll-mt-site-header mt-14">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Plans and Programs</h2>
      </div>

      {levels.length > 0 ? (
        <MembershipLevelCards
          mode="public"
          signedIn={signedIn}
          currentLevel={currentLevel}
          foundingPlusHighlight={foundingPlusHighlight}
          allAccessAvailable={allAccessAvailable}
          clubOrgName={clubOrgName}
        />
      ) : (
        <p className="text-center text-zinc-300">
          Coaching built around how you train. Start with the 12-Week Program.
        </p>
      )}

      <article className="mt-6 w-full rounded-2xl border border-[#52B788]/50 bg-[#22c55e]/10 p-6 shadow-lg shadow-black/30 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9df3bd]">
          Want it built for you?
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100 sm:text-3xl">
          12-Week Coaching Program
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          A personalized daily plan, weekly video breakdowns, and direct messaging with Coach Broc
          for 12 weeks.
        </p>
        <p className="mt-4 text-xl font-bold text-[#98b144]">
          {TWELVE_WEEK_PROGRAM_PRICE_LABEL} one time
        </p>
        <Link
          href="/program"
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          See the Program
        </Link>
      </article>
    </section>
  );
}
