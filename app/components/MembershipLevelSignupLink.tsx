import Link from "next/link";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";
import { buildMembershipCheckoutAuthHref } from "@/lib/membership-checkout-intent-shared";

type Props = {
  level: MembershipLevelKey;
  className?: string;
  orgCode?: string | null;
};

export default function MembershipLevelSignupLink({ level, className, orgCode }: Props) {
  return (
    <Link
      href={buildMembershipCheckoutAuthHref(level, { mode: "signup", orgCode })}
      className={
        className ??
        "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      }
    >
      Get {formatMembershipLevelLabel(level)}
    </Link>
  );
}
