import Link from "next/link";
import { formatWeekStartLabel } from "@/lib/org-weekly-focus-shared";
import { loadCurrentOrgWeeklyFocusForUser } from "@/lib/org-weekly-focus-server";

type OrgWeeklyFocusCardProps = {
  userId: string;
};

export default async function OrgWeeklyFocusCard({ userId }: OrgWeeklyFocusCardProps) {
  const focus = await loadCurrentOrgWeeklyFocusForUser(userId);
  if (!focus) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
        {focus.organizationName}
        {focus.teamName ? ` - ${focus.teamName}` : ""} focus
      </p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-100">{focus.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">Week of {formatWeekStartLabel(focus.weekStartDate)}</p>
      {focus.notes ? <p className="mt-3 text-sm text-zinc-300">{focus.notes}</p> : null}
      {focus.drillIds.length > 0 ? (
        <Link
          href={`/drill-library?drill=${encodeURIComponent(focus.drillIds[0])}`}
          className="mt-4 inline-flex text-sm font-semibold text-[#52B788] underline underline-offset-2"
        >
          Open featured drill
        </Link>
      ) : null}
    </article>
  );
}
