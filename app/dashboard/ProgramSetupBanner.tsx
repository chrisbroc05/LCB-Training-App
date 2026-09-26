import Link from "next/link";

export default function ProgramSetupBanner() {
  return (
    <section className="mt-6 rounded-2xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/10 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#9df3bd]">Finish setting up your program</p>
          <p className="mt-1 text-sm text-zinc-200">
            Answer six quick questions so Coach Broc can build your first week.
          </p>
        </div>
        <Link
          href="/program/start"
          className="inline-flex items-center justify-center rounded-full bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white"
        >
          Finish setting up your program
        </Link>
      </div>
    </section>
  );
}
