import Link from "next/link";
import { buildMemberPdfHref, buildMemberPdfViewerHref } from "@/lib/my-resources-shared";
import {
  canAccessWorkoutResourceFile,
  getWorkoutResourceLockHref,
  getWorkoutResourceLockMessage,
  getWorkoutResourceUpgradeHref,
  getWorkoutResourceUpgradeLabel,
  type WorkoutResource,
} from "@/lib/workout-resources";
import type { PlaybookEntitlementFields } from "@/lib/playbook-entitlements-shared";

type ResourceGuideCardProps = {
  resource: WorkoutResource;
  entitlements: PlaybookEntitlementFields;
};

export default function ResourceGuideCard({
  resource,
  entitlements,
}: ResourceGuideCardProps) {
  const hasAccess = canAccessWorkoutResourceFile(entitlements, resource.filename);
  const lockMessage = getWorkoutResourceLockMessage(resource, resource.title);
  const lockHref = getWorkoutResourceLockHref(resource);

  return (
    <article className="resources-program-card">
      <h4 className="text-base font-bold text-white">{resource.title}</h4>
      <p className="mt-2 text-sm text-zinc-300">{resource.description}</p>

      {hasAccess ? (
        <div className="mt-4 border-t border-[#2b3650] pt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildMemberPdfViewerHref({ kind: "guide", file: resource.filename })}
              className="resources-action-pill"
            >
              {resource.actionLabel}
            </Link>
            <Link
              href={buildMemberPdfHref({ kind: "guide", file: resource.filename, download: true })}
              className="resources-action-pill"
            >
              Download
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-[#2b3650] pt-4">
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {lockHref ? (
              <Link
                href={lockHref}
                className="font-semibold text-[#52B788] underline underline-offset-2"
              >
                {lockMessage}
              </Link>
            ) : (
              lockMessage
            )}
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
