import Link from "next/link";

type InPersonEmergencyReminderCardProps = {
  layout?: "mobile" | "desktop";
};

export default function InPersonEmergencyReminderCard({
  layout = "mobile",
}: InPersonEmergencyReminderCardProps) {
  const className =
    layout === "desktop"
      ? "mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100"
      : "mobile-card border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100";

  return (
    <article className={className}>
      <p className="font-semibold">Add an emergency contact for in-person training</p>
      <p className="mt-2">
        You told us you train in person with Coach Broc. Add an emergency contact in Settings so we
        are ready if something happens at a lesson or team session.
      </p>
      <Link
        href="/settings#in-person-training"
        className="mt-3 inline-flex font-semibold text-[#fde68a] underline"
      >
        Update in Settings
      </Link>
    </article>
  );
}
