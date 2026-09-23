import Link from "next/link";

type DashboardEnrolledSubmissionCardProps = {
  className?: string;
};

export default function DashboardEnrolledSubmissionCard({
  className = "",
}: DashboardEnrolledSubmissionCardProps) {
  return (
    <article
      className={`rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6 ${className}`.trim()}
    >
      <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Coaching Submissions</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Submit a swing video or mindset request for personal feedback from Coach Broc. Your program
        includes unlimited submissions.
      </p>
      <Link
        href="/coaching-submissions"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        Submit for Feedback
      </Link>
    </article>
  );
}
