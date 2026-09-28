import Link from "next/link";

export default function ProgramTodaySetupPrompt() {
  return (
    <div className="mobile-card-stack px-4 pb-28 pt-2 md:mx-auto md:max-w-3xl md:px-6 md:pb-10 md:pt-6">
      <section className="mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 text-center sm:p-8">
        <p className="text-base leading-7 text-zinc-200 sm:text-lg">
          Your plan builds from your answers. Takes about 2 minutes.
        </p>
        <Link
          href="/program/start"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#2D6A4F] px-6 py-3 text-sm font-semibold text-white"
        >
          Finish setup
        </Link>
      </section>
    </div>
  );
}
