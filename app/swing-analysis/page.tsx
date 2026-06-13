import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SwingAnalysisForm from "@/app/swing-analysis/SwingAnalysisForm";

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

        <SwingAnalysisForm />
      </section>
    </div>
  );
}
