import { formatWeekStartLabel } from "@/lib/org-weekly-focus-shared";
import { loadCurrentOrgWeeklyFocusForUser } from "@/lib/org-weekly-focus-server";
import FocusDrillCards from "@/app/components/FocusDrillCards";
import { getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";
import { fetchVimeoThumbnailMap } from "@/lib/vimeo-oembed";

type OrgWeeklyFocusCardProps = {
  userId: string;
};

export default async function OrgWeeklyFocusCard({ userId }: OrgWeeklyFocusCardProps) {
  const focus = await loadCurrentOrgWeeklyFocusForUser(userId);
  if (!focus) {
    return null;
  }

  const drillVideos = getDrillLibraryVideosByIds(focus.drillIds);
  const thumbnailMap =
    drillVideos.length > 0
      ? await fetchVimeoThumbnailMap(drillVideos.map((video) => video.url))
      : {};

  return (
    <article className="rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
        {focus.organizationName}
        {focus.teamName ? ` - ${focus.teamName}` : ""} focus
      </p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-100">{focus.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">Week of {formatWeekStartLabel(focus.weekStartDate)}</p>
      {focus.notes ? <p className="mt-3 text-sm text-zinc-300">{focus.notes}</p> : null}
      <FocusDrillCards
        drillIds={focus.drillIds}
        thumbnailMap={thumbnailMap}
        seeAllHref="/drill-library"
        seeAllLabel="See all drills"
      />
    </article>
  );
}
