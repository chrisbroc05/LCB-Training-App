import { formatScheduledCallDateTime } from "@/lib/assessment-call";

type DashboardBookCallCardProps = {
  calendlyBookingUrl: string;
  callBooked: boolean;
  callScheduledAt: Date | null;
  className?: string;
};

export default function DashboardBookCallCard({
  calendlyBookingUrl,
  callBooked,
  callScheduledAt,
  className = "",
}: DashboardBookCallCardProps) {
  const hasScheduledCall = callBooked && callScheduledAt;

  return (
    <article
      className={`rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-5 sm:p-6 ${className}`.trim()}
    >
      <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Book a Call</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Schedule your weekly check-in call with Coach Broc.
      </p>

      {hasScheduledCall ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-200">
          Your next call with Coach Broc is scheduled for{" "}
          <span className="font-semibold text-[#9df3bd]">
            {formatScheduledCallDateTime(callScheduledAt)}
          </span>
          .
        </p>
      ) : (
        <a
          href={calendlyBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Book a Call
        </a>
      )}
    </article>
  );
}
