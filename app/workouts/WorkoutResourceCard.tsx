import Link from "next/link";
import {
  canAccessWorkoutResource,
  getWorkoutResourceLockMessage,
  getWorkoutResourceUpgradeHref,
  getWorkoutResourceUpgradeLabel,
  getWorkoutResourceUrl,
  type WorkoutResource,
} from "@/lib/workout-resources";
import type { DatabaseTier } from "@/lib/membership";

type WorkoutResourceCardProps = {
  resource: WorkoutResource;
  membershipTier: DatabaseTier;
};

export default function WorkoutResourceCard({
  resource,
  membershipTier,
}: WorkoutResourceCardProps) {
  const hasAccess = canAccessWorkoutResource(membershipTier, resource.requiredTier);

  return (
    <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
      <h4 className="text-base font-semibold text-zinc-100">{resource.title}</h4>
      <p className="mt-2 text-sm text-zinc-300">{resource.description}</p>

      {hasAccess ? (
        <Link
          href={getWorkoutResourceUrl(resource.filename)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          View / Download
        </Link>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {getWorkoutResourceLockMessage(resource.requiredTier, resource.title)}
          </div>
          <Link
            href={getWorkoutResourceUpgradeHref(resource.requiredTier)}
            className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            {getWorkoutResourceUpgradeLabel(resource.requiredTier)}
          </Link>
        </div>
      )}
    </article>
  );
}
