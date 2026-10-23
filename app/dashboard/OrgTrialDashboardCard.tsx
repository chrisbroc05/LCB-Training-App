import { resolveEffectiveLevel } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { getOrgTrialIncludesLine } from "@/lib/org-trial-copy-shared";
import { formatChicagoTrialEndLabel } from "@/lib/org-trial-dates-shared";
import { prisma } from "@/lib/prisma";

type OrgTrialDashboardCardProps = {
  userId: string;
};

export default async function OrgTrialDashboardCard({ userId }: OrgTrialDashboardCardProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  if (!user) {
    return null;
  }

  const access = toAccessUserFields(user);
  if (resolveEffectiveLevel(access) !== "ORG_TRIAL") {
    return null;
  }

  const orgName = access.orgName?.trim() || "Your organization";
  const endLabel = formatChicagoTrialEndLabel(access.orgTrialEndsAt ?? null);
  const includesLine = getOrgTrialIncludesLine();

  return (
    <article className="rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
        {orgName} Trial
      </p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-100">What your trial includes</h2>
      <p className="mt-2 text-sm text-zinc-300">{includesLine}</p>
      {endLabel ? (
        <p className="mt-3 text-sm text-zinc-400">Trial ends on {endLabel} (Chicago time).</p>
      ) : null}
      {access.orgTeamName ? (
        <p className="mt-2 text-xs text-zinc-500">Team: {access.orgTeamName}</p>
      ) : null}
    </article>
  );
}
