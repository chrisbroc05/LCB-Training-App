type AdminMemberPlanBadgeProps = {
  planBadgeLabel: string;
  planTooltipLabel: string;
  planExpiryLabel?: string | null;
};

export default function AdminMemberPlanBadge({
  planBadgeLabel,
  planTooltipLabel,
  planExpiryLabel,
}: AdminMemberPlanBadgeProps) {
  return (
    <span className="inline-flex max-w-full min-w-0 flex-col items-end gap-0.5">
      <span
        className="inline-block max-w-full truncate whitespace-nowrap rounded-full border border-[#2b3650] bg-[#0b1324] px-2.5 py-1 text-xs font-semibold text-zinc-100"
        title={planTooltipLabel}
      >
        {planBadgeLabel}
      </span>
      {planExpiryLabel ? (
        <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {planExpiryLabel}
        </span>
      ) : null}
    </span>
  );
}
