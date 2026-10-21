import ResourceGuideCard from "@/app/resources/ResourceGuideCard";
import { workoutResourceGroups } from "@/lib/workout-resources";
import type { PlaybookEntitlementFields } from "@/lib/playbook-entitlements-shared";

type DrillLibraryMobileResourcesProps = {
  entitlements: PlaybookEntitlementFields;
};

export default function DrillLibraryMobileResources({
  entitlements,
}: DrillLibraryMobileResourcesProps) {
  const resources = workoutResourceGroups.flatMap((group) => group.resources);

  return (
    <section className="mobile-card-stack mt-6 px-4 md:hidden">
      <h2 className="text-lg font-semibold text-zinc-100">Resources</h2>
      <p className="text-sm text-zinc-400">
        Downloadable guides and bonus training resources.
      </p>
      <div className="mobile-card-stack">
        {resources.map((resource) => (
          <ResourceGuideCard
            key={resource.filename}
            resource={resource}
            entitlements={entitlements}
          />
        ))}
      </div>
    </section>
  );
}
