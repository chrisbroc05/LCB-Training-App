import Link from "next/link";
import {
  getOrgTrialJanuaryMembershipHref,
  getOrgTrialJanuaryUnlockLabel,
  getOrgTrialLockedContentHref,
  getOrgTrialLockedContentMessage,
  type OrgTrialJanuaryUnlockMembership,
  type OrgTrialLockedContentSurface,
} from "@/lib/org-trial-unlock-copy-shared";

type OrgTrialJanuaryUnlockLinkProps = {
  membership?: OrgTrialJanuaryUnlockMembership;
  surface?: OrgTrialLockedContentSurface;
  className?: string;
  linkClassName?: string;
  label?: string;
  href?: string;
};

export default function OrgTrialJanuaryUnlockLink({
  membership = "PLUS",
  surface,
  className,
  linkClassName = "font-semibold text-[#52B788] underline underline-offset-2",
  label,
  href,
}: OrgTrialJanuaryUnlockLinkProps) {
  const text =
    label ??
    (surface ? getOrgTrialLockedContentMessage(surface) : getOrgTrialJanuaryUnlockLabel(membership));
  const targetHref =
    href ??
    (surface ? getOrgTrialLockedContentHref(surface) : getOrgTrialJanuaryMembershipHref());

  if (className) {
    return (
      <p className={className}>
        <Link href={targetHref} className={linkClassName}>
          {text}
        </Link>
      </p>
    );
  }

  return (
    <Link href={targetHref} className={linkClassName}>
      {text}
    </Link>
  );
}
