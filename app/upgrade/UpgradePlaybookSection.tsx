import UpgradeActions from "@/app/upgrade/UpgradeActions";
import {
  PLAYBOOK_NAME,
  PLAYBOOK_PURCHASE_PRICE_SUBTITLE,
} from "@/lib/playbook-branding";
import { membershipTiers } from "@/lib/membership";

const playbookTier = membershipTiers.find((tier) => tier.key === "basic")!;

export default function UpgradePlaybookSection() {
  return (
    <section className="mt-8">
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{PLAYBOOK_NAME}</h2>
        <p className="mt-2 text-xl font-bold text-[#98b144]">$59 one-time</p>
        <p className="mt-1 text-xs text-zinc-400">{PLAYBOOK_PURCHASE_PRICE_SUBTITLE}</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          Four interactive chapters with reflection questions, the mental and physical frameworks
          Coach Broc uses in player development, and a downloadable PDF of your completed answers.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-200">
          {playbookTier.features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <UpgradeActions tier="BASIC" />
      </article>
    </section>
  );
}
