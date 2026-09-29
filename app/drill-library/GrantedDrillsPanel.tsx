import Link from "next/link";
import {
  getDrillLibraryVideoId,
  getDrillLibraryVideosByIds,
} from "@/lib/drill-library-videos";

type GrantedDrillsPanelProps = {
  grantedDrillIds: string[];
};

export default function GrantedDrillsPanel({ grantedDrillIds }: GrantedDrillsPanelProps) {
  const drills = getDrillLibraryVideosByIds(grantedDrillIds);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Your Coach-Picked Drills</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          These are the drills Coach Broc attached to your coaching breakdown. The full drill library
          is available with The Playbook or the 12-Week Coaching Program.
        </p>
        {drills.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {drills.map((drill) => {
              const drillId = getDrillLibraryVideoId(drill);
              if (!drillId) {
                return null;
              }

              return (
                <li key={drill.url}>
                  <Link
                    href={`/drill-library?drill=${encodeURIComponent(drillId)}`}
                    className="block rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm font-semibold text-[#52B788] transition hover:border-[#52B788]/50"
                  >
                    {drill.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        <Link
          href="/program"
          className="mt-6 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          See the 12-Week Program
        </Link>
      </section>
    </div>
  );
}
