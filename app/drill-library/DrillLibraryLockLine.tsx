import LockedContentUpsell from "@/app/components/LockedContentUpsell";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type DrillLibraryLockLineProps = {
  effective: EffectiveAccessLevel;
  customMessage?: string | null;
};

export default function DrillLibraryLockLine({ effective, customMessage }: DrillLibraryLockLineProps) {
  return <LockedContentUpsell effective={effective} customMessage={customMessage} />;
}
