"use client";

import Link from "next/link";
import PurchaseLinkRecoveryForm from "@/app/resources/PurchaseLinkRecoveryForm";
import type { FixItPlanGenerated } from "@/lib/fix-it-plans-data.generated";
import { PURCHASE_LINK_RECOVERY_CONFIRMATION } from "@/lib/resource-download-access-shared";

type FixItPlanAccessRecoveryClientProps = {
  plan: FixItPlanGenerated;
};

export default function FixItPlanAccessRecoveryClient({ plan }: FixItPlanAccessRecoveryClientProps) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Fix-It Hitting Plan</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">{plan.title}</h1>
      <p className="mt-2 text-base text-zinc-400">{plan.subtitle}</p>

      <div className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 p-6">
        <h2 className="text-lg font-semibold text-white">Already bought this plan?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Enter the email you used and we&apos;ll send you your plan link.
        </p>

        <PurchaseLinkRecoveryForm
          resourceSlug={plan.resourceSlug}
          apiPath="/api/fix-it/request-plan-link"
          submitLabel="Email my plan link"
          confirmationMessage={PURCHASE_LINK_RECOVERY_CONFIRMATION}
        />
      </div>

      <p className="mt-8 text-center text-sm text-zinc-400">
        Haven&apos;t bought yet?{" "}
        <Link href="/fix-it" className="font-semibold text-[#52B788] underline-offset-2 hover:underline">
          See the Fix-It plans
        </Link>
      </p>
    </div>
  );
}
