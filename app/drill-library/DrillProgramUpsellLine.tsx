import LockedContentUpsell from "@/app/components/LockedContentUpsell";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type DrillProgramUpsellLineProps = {
  effective: EffectiveAccessLevel;
};

export default function DrillProgramUpsellLine({ effective }: DrillProgramUpsellLineProps) {
  return (
    <div className="mt-4">
      <LockedContentUpsell effective={effective} />
    </div>
  );
}
