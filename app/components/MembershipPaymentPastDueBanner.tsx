"use client";

import ManageBillingButton from "@/app/settings/ManageBillingButton";

type Props = {
  levelLabel: string;
  graceEndsLabel: string;
};

export default function MembershipPaymentPastDueBanner({ levelLabel, graceEndsLabel }: Props) {
  return (
    <div
      className="membership-payment-past-due-banner border-b border-amber-500/40 bg-amber-500/15 py-3 text-center text-sm text-amber-50"
      role="status"
    >
      <p>
        Your {levelLabel} payment didn&apos;t go through. Update your card by {graceEndsLabel} to
        keep access.
      </p>
      <div className="mt-2 flex justify-center">
        <ManageBillingButton label="Update card" variant="primary" />
      </div>
    </div>
  );
}
