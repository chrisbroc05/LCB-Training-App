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

type ResourceGuideCardProps = {
  resource: WorkoutResource;
  membershipTier: DatabaseTier;
};

export default function ResourceGuideCard({
  resource,
  membershipTier,
}: ResourceGuideCardProps) {
  const hasAccess = canAccessWorkoutResource(membershipTier, resource.requiredTier);

  return (
    <article className="resources-program-card">
      <h4 className="text-base font-bold text-white">{resource.title}</h4>
      <p className="mt-2 text-sm text-zinc-300">{resource.description}</p>

      {hasAccess ? (
        <div className="mt-4 border-t border-[#2b3650] pt-4">
          <Link
            href={getWorkoutResourceUrl(resource.filename)}
            target="_blank"
            rel="noopener noreferrer"
            className="resources-action-pill"
          >
            {resource.actionLabel}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-[#2b3650] pt-4">
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {getWorkoutResourceLockMessage(resource.requiredTier, resource.title)}
          </div>
          <Link
            href={getWorkoutResourceUpgradeHref(resource.requiredTier)}
            className="resources-action-pill"
          >
            {getWorkoutResourceUpgradeLabel(resource.requiredTier)}
          </Link>
        </div>
      )}
    </article>
  );
}
