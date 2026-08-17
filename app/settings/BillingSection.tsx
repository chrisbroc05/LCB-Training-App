import Link from "next/link";
import SettingsCard from "@/app/settings/SettingsCard";
import CancelSubscriptionButton from "@/app/settings/CancelSubscriptionButton";
import ManageBillingButton from "@/app/settings/ManageBillingButton";
import {
  settingsAccentTextClass,
  settingsBodyTextClass,
  settingsMutedTextClass,
  settingsPrimaryButtonClass,
  settingsWarningTextClass,
} from "@/app/settings/settings-styles";
import {
  formatDatabaseTierLabel,
  isLifetimeBasicMember,
  isManualMembershipMember,
  type DatabaseTier,
} from "@/lib/membership";

type BillingSectionProps = {
  membershipTier: DatabaseTier;
  subscriptionStatus: string;
  nextBillingDate: string;
  isCancelScheduled: boolean;
  hasSubscription: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export default function BillingSection({
  membershipTier,
  subscriptionStatus,
  nextBillingDate,
  isCancelScheduled,
  hasSubscription,
  stripeCustomerId,
  stripeSubscriptionId,
}: BillingSectionProps) {
  const isFreeMember = membershipTier === "FREE";
  const lifetimeBasic = isLifetimeBasicMember(membershipTier, stripeSubscriptionId);
  const manualMembership = isManualMembershipMember(membershipTier, stripeSubscriptionId);
  const isPaidSubscriptionTier = membershipTier === "MEMORABLE" || membershipTier === "ELITE";

  return (
    <SettingsCard title="Billing">
      {isFreeMember ? (
        <div className="space-y-4">
          <p className={settingsBodyTextClass}>
            Current plan: <span className={settingsAccentTextClass}>Free Plan</span>
          </p>
          <Link href="/upgrade" className={`inline-flex ${settingsPrimaryButtonClass}`}>
            Upgrade
          </Link>
        </div>
      ) : lifetimeBasic ? (
        <div className="space-y-3">
          <p className={settingsAccentTextClass}>Basic Plan -- Lifetime Access</p>
          <p className={settingsMutedTextClass}>
            Your Basic membership is a one-time purchase with lifetime access to the full content
            library and Playbook.
          </p>
        </div>
      ) : manualMembership ? (
        <div className="space-y-3">
          <p className={settingsBodyTextClass}>
            Current plan:{" "}
            <span className={settingsAccentTextClass}>
              {formatDatabaseTierLabel(membershipTier)}
            </span>
          </p>
          <p className={settingsMutedTextClass}>Billing: Manual</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={settingsBodyTextClass}>
            Current plan:{" "}
            <span className={settingsAccentTextClass}>
              {formatDatabaseTierLabel(membershipTier)}
            </span>
          </p>
          <p className={settingsMutedTextClass}>
            Subscription status: {subscriptionStatus.replaceAll("_", " ")}
          </p>
          <p className={settingsMutedTextClass}>Next billing date: {nextBillingDate}</p>
          {isCancelScheduled ? (
            <p className={settingsWarningTextClass}>
              Your subscription is set to cancel at period end.
            </p>
          ) : null}
          {isPaidSubscriptionTier && stripeCustomerId ? <ManageBillingButton /> : null}
          {hasSubscription ? (
            <div className="border-t border-[#2b3650] pt-4">
              <CancelSubscriptionButton disabled={isCancelScheduled} />
            </div>
          ) : (
            <p className={settingsMutedTextClass}>
              No active Stripe subscription was found for this account.
            </p>
          )}
        </div>
      )}
    </SettingsCard>
  );
}
