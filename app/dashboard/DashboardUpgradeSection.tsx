import Link from "next/link";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import { getTierPricing } from "@/lib/billing";
import {
  keyToDatabaseTier,
  membershipTiers,
  type DatabaseTier,
  type TierKey,
} from "@/lib/membership";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
  hasSubscription: boolean;
};

type UpgradeSectionConfig = {
  title: string;
  description: string;
  upgradeTiers: TierKey[];
};

const upgradeSectionByTier: Partial<Record<DatabaseTier, UpgradeSectionConfig>> = {
  FREE: {
    title: "Unlock More with LCB Training",
    description:
      "Choose a paid plan to unlock the full drill library, workout programs, and coaching support.",
    upgradeTiers: ["basic", "pro", "elite"],
  },
  BASIC: {
    title: "Unlock Coaching Submissions",
    description:
      "Upgrade to Pro or Elite for unlimited swing analysis and mental game support from Coach Broc.",
    upgradeTiers: ["pro", "elite"],
  },
  PRO: {
    title: "Get Priority Access",
    description:
      "Elite adds priority feedback on every submission plus monthly group coaching call access.",
    upgradeTiers: ["elite"],
  },
};

function getGridClassName(count: number) {
  if (count === 1) {
    return "mx-auto max-w-md";
  }
  if (count === 2) {
    return "md:grid-cols-2";
  }
  return "md:grid-cols-3";
}

export default function DashboardUpgradeSection({
  membershipTier,
  hasSubscription,
}: DashboardUpgradeSectionProps) {
  const config = upgradeSectionByTier[membershipTier];
  if (!config) {
    return null;
  }

  const upgradeTierCards = membershipTiers.filter((tier) =>
    config.upgradeTiers.includes(tier.key),
  );

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          {config.title}
        </h2>
        <p className="mt-2 text-zinc-300">{config.description}</p>
        <p className="mt-3 text-sm text-zinc-400">
          Prices shown are monthly. Annual pricing is available in Settings.
        </p>
      </div>

      <div className={`mt-8 grid gap-5 ${getGridClassName(upgradeTierCards.length)}`}>
        {upgradeTierCards.map((tier) => {
          const pricing = getTierPricing(tier.key, "monthly");
          const databaseTier = keyToDatabaseTier[tier.key] as "BASIC" | "PRO" | "ELITE";

          return (
            <article
              key={tier.key}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
            >
              <h3 className="text-xl font-semibold text-zinc-100">{tier.name}</h3>
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{pricing.primary}</p>
              <p className="mt-3 text-zinc-300">{tier.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#22c55e]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {hasSubscription ? (
                <Link
                  href={`/settings?tier=${tier.key}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  Upgrade to {tier.name}
                </Link>
              ) : (
                <div className="mt-6 [&_button]:w-full">
                  <UpgradeActions tier={databaseTier} billingFrequency="monthly" />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
