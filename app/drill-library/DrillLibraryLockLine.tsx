import LockedContentUpsell from "@/app/components/LockedContentUpsell";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type DrillLibraryLockLineProps = {
  effective: EffectiveAccessLevel;
};

export default function DrillLibraryLockLine({ effective }: DrillLibraryLockLineProps) {
  return <LockedContentUpsell effective={effective} />;
}
