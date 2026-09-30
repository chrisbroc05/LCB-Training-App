import Link from "next/link";

type VideosFromCoachLinkProps = {
  unwatchedCount?: number;
  className?: string;
  layout?: "today" | "profile";
};

export default function VideosFromCoachLink({
  unwatchedCount = 0,
  className = "",
  layout = "today",
}: VideosFromCoachLinkProps) {
  const showBadge = unwatchedCount > 0;

  if (layout === "profile") {
    return (
      <Link
        href="/videos"
        className={`flex items-center justify-between rounded-xl border border-[#2b3650] bg-black/30 px-4 py-4 text-sm font-semibold text-zinc-100 transition hover:border-[#52B788]/40 ${className}`}
      >
        <span>Videos from Coach Broc</span>
        {showBadge ? (
          <span className="rounded-full bg-[#22c55e] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
            New
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/videos"
      className={`inline-flex items-center gap-2 rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-[#52B788]/40 ${className}`}
    >
      <span>Videos from Coach Broc</span>
      {showBadge ? (
        <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
          New
        </span>
      ) : null}
    </Link>
  );
}
