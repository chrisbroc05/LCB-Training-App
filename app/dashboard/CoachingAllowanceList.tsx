import { listCoachingAllowanceLines } from "@/lib/coaching-allowance-lines-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";

type CoachingAllowanceListProps = {
  user: AccessUserFields & CoachingSubmissionUserFields;
};

export default function CoachingAllowanceList({ user }: CoachingAllowanceListProps) {
  const lines = listCoachingAllowanceLines(user);
  if (lines.length === 0) {
    return (
      <p className="mt-3 text-sm text-zinc-400">
        Coaching submissions are not included on your current plan.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-3">
      {lines.map((line) => (
        <li
          key={line.id}
          className="rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-300"
        >
          <p className="font-semibold text-[#9df3bd]">{line.label}</p>
          {line.detail ? <p className="mt-1 text-xs text-zinc-400">{line.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}
