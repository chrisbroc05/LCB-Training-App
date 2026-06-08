import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SwingAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Swing Analysis Submission</h1>
        <p className="mt-2 text-zinc-300">
          Upload your latest swing video and include context so our coaches can provide
          targeted feedback.
        </p>

        <form className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm text-zinc-300">Upload video</span>
            <input
              type="file"
              accept="video/*"
              className="mt-2 w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-300">Pitch Type Focus</span>
              <select className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]">
                <option>Fastball timing</option>
                <option>Offspeed recognition</option>
                <option>Inside pitch mechanics</option>
                <option>Outside pitch approach</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-zinc-300">Handedness</span>
              <select className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]">
                <option>Right-handed hitter</option>
                <option>Left-handed hitter</option>
                <option>Switch hitter</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-300">Notes for coach</span>
            <textarea
              rows={5}
              placeholder="Include what you are currently working on and where you feel inconsistent."
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
            />
          </label>

          <button
            type="button"
            className="rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72]"
          >
            Submit Swing Analysis
          </button>
        </form>
      </section>
    </div>
  );
}
