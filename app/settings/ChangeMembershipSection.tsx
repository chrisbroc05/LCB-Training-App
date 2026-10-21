"use client";

import Link from "next/link";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsBodyTextClass,
  settingsInnerCardClass,
  settingsPrimaryButtonClass,
  settingsSectionTitleClass,
} from "@/app/settings/settings-styles";
import { TWELVE_WEEK_PROGRAM_NAME, TWELVE_WEEK_PROGRAM_PRICE_LABEL } from "@/lib/twelve-week-program";
import { TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT } from "@/lib/twelve-week-program-copy-shared";
import { formatUserFacingMembershipLabel, isTwelveWeekProgramMember, type DatabaseTier } from "@/lib/membership";

type ChangeMembershipSectionProps = {
  currentTier: DatabaseTier;
  hasSubscription: boolean;
  isLifetimeBasic?: boolean;
  isManualMembership?: boolean;
};

export default function ChangeMembershipSection({
  currentTier,
  isLifetimeBasic = false,
}: ChangeMembershipSectionProps) {
  if (isTwelveWeekProgramMember(currentTier)) {
    return (
      <SettingsCard title="Membership">
        <p className={`font-semibold text-[#98b144] ${settingsBodyTextClass}`}>
          {formatUserFacingMembershipLabel(currentTier)}
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          You are enrolled in the 12-Week Coaching Program with full access to coaching submissions,
          the Playbook, and {TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT}.
        </p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="Upgrade Membership"
      description={
        isLifetimeBasic
          ? `Join the 12-Week Coaching Program for unlimited coaching submissions and ${TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT}.`
          : "Join the 12-Week Coaching Program to unlock full coaching support and training resources."
      }
    >
      <article className={settingsInnerCardClass}>
        <h3 className={`text-base ${settingsSectionTitleClass}`}>{TWELVE_WEEK_PROGRAM_NAME}</h3>
        <p className={`mt-2 font-semibold ${settingsBodyTextClass}`}>
          {TWELVE_WEEK_PROGRAM_PRICE_LABEL} one-time
        </p>
        <p className={`mt-3 ${settingsBodyTextClass}`}>
          Unlimited submissions, full Playbook access, workout programs, and{" "}
          {TWELVE_WEEK_KICKOFF_AND_CHECKINS_SHORT}.
        </p>
        <Link href="/program" className={`mt-4 inline-flex ${settingsPrimaryButtonClass}`}>
          View Program Details
        </Link>
      </article>
    </SettingsCard>
  );
}
