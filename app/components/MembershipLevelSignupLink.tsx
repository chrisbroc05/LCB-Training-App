import Link from "next/link";
import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";
import { buildMembershipCheckoutAuthHref } from "@/lib/membership-checkout-intent-shared";

type Props = {
  level: MembershipLevelKey;
  billingInterval?: MembershipBillingIntervalKey;
  className?: string;
  orgCode?: string | null;
  label?: string;
};

export default function MembershipLevelSignupLink({
  level,
  billingInterval = "MONTHLY",
  className,
  orgCode,
  label,
}: Props) {
  return (
    <Link
      href={buildMembershipCheckoutAuthHref(level, {
        mode: "signup",
        orgCode,
        billingInterval,
      })}
      className={
        className ??
        "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      }
    >
      {label ?? `Get ${formatMembershipLevelLabel(level)}`}
    </Link>
  );
}
