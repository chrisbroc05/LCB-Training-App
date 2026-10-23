import Link from "next/link";
import type { EffectiveAccessLevel } from "@/lib/access-shared";
import {
  getLockedContentMessage,
  shouldShowPlaybookStarterPromo,
} from "@/lib/locked-content-copy-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

type LockedContentUpsellProps = {
  effective: EffectiveAccessLevel;
  surface?: "drill" | "workout" | "playbook" | "guide";
  className?: string;
  customMessage?: string | null;
};

export default function LockedContentUpsell({
  effective,
  surface = "drill",
  className = "mt-2 text-center text-sm leading-relaxed text-zinc-400",
  customMessage,
}: LockedContentUpsellProps) {
  if (customMessage?.trim()) {
    return <p className={className}>{customMessage.trim()}</p>;
  }
  if (shouldShowPlaybookStarterPromo(effective)) {
    return (
      <p className={className}>
        Unlocks with the{" "}
        <Link href="/program" className="font-semibold text-[#52B788] underline underline-offset-2">
          12-Week Program
        </Link>
        . Already own {PLAYBOOK_NAME}? Use code STARTER25 at checkout.
      </p>
    );
  }

  return <p className={className}>{getLockedContentMessage(effective, surface)}</p>;
}
