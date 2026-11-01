import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlayerFirstName } from "@/lib/account-shared";
import { getRequestServerSession } from "@/lib/auth-server-session";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { buildOrgJoinLandingPath } from "@/lib/org-join-auth-shared";
import { getOrgTrialIncludesLine } from "@/lib/org-trial-copy-shared";
import { formatChicagoTrialEndLabel } from "@/lib/org-trial-dates-shared";
import { findOrganizationByJoinCode } from "@/lib/org-server";
import { prisma } from "@/lib/prisma";

type WelcomePageProps = {
  params: Promise<{ code: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrgJoinWelcomePage({ params }: WelcomePageProps) {
  const { code: codeParam } = await params;
  const session = await getRequestServerSession();
  if (!session?.user?.id) {
    redirect(buildOrgJoinLandingPath(codeParam));
  }

  const match = await findOrganizationByJoinCode(codeParam);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      ...userAccessSelect,
      playerFirstName: true,
      name: true,
      email: true,
      orgTeam: { select: { id: true, name: true, active: true } },
    },
  });

  if (!user?.organizationId || !user.organization) {
    redirect(buildOrgJoinLandingPath(codeParam));
  }

  if (match && user.organizationId !== match.organization.id) {
    redirect(buildOrgJoinLandingPath(codeParam));
  }

  const access = toAccessUserFields(user);
  const orgName = access.orgName?.trim() || "your club";
  const firstName = getPlayerFirstName(user);
  const hasPersonalName = Boolean(user.playerFirstName?.trim() || user.name?.trim());
  const teamName = user.orgTeam?.name ?? null;
  const includesLine = getOrgTrialIncludesLine();
  const endLabel = formatChicagoTrialEndLabel(access.orgTrialEndsAt ?? null);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8 text-center">
        {access.orgLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={access.orgLogoUrl}
            alt=""
            className="mx-auto h-16 w-16 rounded-full object-cover"
          />
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold text-zinc-100">
          {hasPersonalName ? `Welcome, ${firstName}!` : `Welcome! You're joining ${orgName}.`}
        </h1>
        {hasPersonalName ? (
          <p className="mt-2 text-sm text-zinc-300">You&apos;re in with {orgName}.</p>
        ) : null}
        {teamName ? <p className="mt-2 text-sm text-zinc-400">Team: {teamName}</p> : null}
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{includesLine}</p>
        {endLabel ? (
          <p className="mt-3 text-xs text-zinc-500">Trial ends {endLabel}.</p>
        ) : null}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black"
        >
          Go to dashboard
        </Link>
      </section>
    </div>
  );
}
