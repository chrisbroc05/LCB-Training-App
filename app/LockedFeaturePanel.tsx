import Link from "next/link";

type LockedFeaturePanelProps = {
  title: string;
  description: string;
  message: string;
  upgradeLabel?: string;
  upgradeHref?: string;
};

export default function LockedFeaturePanel({
  title,
  description,
  message,
  upgradeLabel = "Upgrade Membership",
  upgradeHref = "/upgrade",
}: LockedFeaturePanelProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-zinc-300">{description}</p>

        <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {message}
        </div>

        <div className="mt-6">
          <Link
            href={upgradeHref}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
          >
            {upgradeLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
