import type { SerializedGoalItem } from "@/lib/goal-check-in-constants";

type GoalItemCategoryBadgeProps = {
  label: string;
  badgeClassName: string;
};

export function GoalItemCategoryBadge({ label, badgeClassName }: GoalItemCategoryBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

function GoalCompletionIcon({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-black">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 rounded-full border-2 border-[#4f5f83] bg-transparent" />
  );
}

function formatCompletedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type GoalTrackerListProps = {
  goals: SerializedGoalItem[];
  interactive?: boolean;
  onToggleGoal?: (goalId: number) => void | Promise<void>;
  togglingGoalId?: number | null;
  linkToGoalSetting?: boolean;
};

export default function GoalTrackerList({
  goals,
  interactive = false,
  onToggleGoal,
  togglingGoalId = null,
  linkToGoalSetting = false,
}: GoalTrackerListProps) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const content = (
          <>
            <div className="flex items-start gap-3">
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onToggleGoal?.(goal.id)}
                  disabled={togglingGoalId === goal.id}
                  aria-label={goal.completed ? "Mark goal incomplete" : "Mark goal complete"}
                  className="mt-0.5 shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoalCompletionIcon completed={goal.completed} />
                </button>
              ) : (
                <div className="mt-0.5 shrink-0">
                  <GoalCompletionIcon completed={goal.completed} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <GoalItemCategoryBadge
                    label={goal.categoryLabel}
                    badgeClassName={goal.badgeClassName}
                  />
                  {goal.targetValue ? (
                    <span className="text-xs text-zinc-400">Target: {goal.targetValue}</span>
                  ) : null}
                </div>
                <p
                  className={`mt-2 text-sm ${
                    goal.completed ? "text-zinc-400 line-through" : "text-zinc-100"
                  }`}
                >
                  {goal.description}
                </p>
                {goal.completed && goal.completedAt ? (
                  <p className="mt-1 text-xs text-[#9df3bd]">
                    Completed {formatCompletedDate(goal.completedAt)}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        );

        if (linkToGoalSetting) {
          return (
            <a
              key={goal.id}
              href="/goal-setting"
              className="block rounded-xl border border-[#2b3650] bg-black/30 p-4 transition hover:border-[#7f9434]"
            >
              {content}
            </a>
          );
        }

        return (
          <div key={goal.id} className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            {content}
          </div>
        );
      })}
    </div>
  );
}
