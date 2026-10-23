type AdminMemberPlanBadgeProps = {
  planDisplayLabel: string;
  planExpiryLabel?: string | null;
};

export default function AdminMemberPlanBadge({
  planDisplayLabel,
  planExpiryLabel,
}: AdminMemberPlanBadgeProps) {
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex rounded-full border border-[#2b3650] bg-[#0b1324] px-2.5 py-1 text-xs font-semibold text-zinc-100">
        {planDisplayLabel}
      </span>
      {planExpiryLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {planExpiryLabel}
        </span>
      ) : null}
    </span>
  );
}
