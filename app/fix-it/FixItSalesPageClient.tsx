"use client";

import { useState } from "react";
import DigitalProductSalesFinalNotice from "@/app/resources/DigitalProductSalesFinalNotice";
import ResourceLeadModal from "@/app/resources/ResourceLeadModal";
import {
  followResourceLeadAction,
  postResourceLeadAction,
  readLeadIdFromCookie,
} from "@/lib/resources-lead-client";
import { FIX_IT_PLANS, FIX_IT_PLANS_META } from "@/lib/fix-it-plans-shared";
import { getResourceDefinition, type ResourceDefinition } from "@/lib/resources-shared";

type FixItSalesPageClientProps = {
  isLoggedIn: boolean;
};

function PlanCard({
  plan,
  onBuy,
  busy,
}: {
  plan: (typeof FIX_IT_PLANS)[number];
  onBuy: () => void;
  busy: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#52B788]/40 bg-[#0d1c31] p-5 shadow-lg shadow-black/20">
      <h2 className="text-xl font-semibold text-white">{plan.title}</h2>
      <p className="mt-1 text-sm font-medium text-[#52B788]">{plan.priceLabel}</p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-200">Sound familiar?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {plan.symptoms.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-200">Why it happens</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{plan.problem}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-200">The fix</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{plan.fix}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-200">What you get</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>A 3-week, day-by-day plan (PDF)</li>
          <li>My drill videos for the plan</li>
          <li>A before-and-after test so you can see your progress</li>
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-zinc-200">What fixed looks like</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {plan.fixedLooksLike.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={onBuy}
        className="mt-6 min-h-[52px] w-full rounded-full bg-[#2D6A4F] py-3.5 text-sm font-semibold text-white hover:bg-[#52B788] disabled:opacity-70"
      >
        {plan.buttonLabel}
      </button>
      <DigitalProductSalesFinalNotice className="mt-2 text-center text-xs leading-relaxed text-zinc-500" />
    </article>
  );
}

export default function FixItSalesPageClient({ isLoggedIn }: FixItSalesPageClientProps) {
  const [leadResource, setLeadResource] = useState<ResourceDefinition | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const swingResource = getResourceDefinition("free-swing-analysis");

  const runLeadAction = async (resource: ResourceDefinition, leadId?: string) => {
    setBusySlug(resource.slug);
    try {
      const result = await postResourceLeadAction({
        resourceSlug: resource.slug,
        ...(leadId ? { leadId } : {}),
      });
      followResourceLeadAction(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusySlug(null);
    }
  };

  const handleBuy = async (resourceSlug: string) => {
    const resource = getResourceDefinition(resourceSlug);
    if (!resource) {
      return;
    }
    if (isLoggedIn) {
      await runLeadAction(resource);
      return;
    }
    const leadId = readLeadIdFromCookie();
    if (leadId) {
      await runLeadAction(resource, leadId);
      return;
    }
    setLeadResource(resource);
  };

  const handleFreeSwing = async () => {
    if (!swingResource) {
      return;
    }
    if (isLoggedIn) {
      await runLeadAction(swingResource);
      return;
    }
    const leadId = readLeadIdFromCookie();
    if (leadId) {
      await runLeadAction(swingResource, leadId);
      return;
    }
    setLeadResource(swingResource);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {FIX_IT_PLANS.map((plan) => (
          <PlanCard
            key={plan.resourceSlug}
            plan={plan}
            busy={busySlug === plan.resourceSlug}
            onBuy={() => void handleBuy(plan.resourceSlug)}
          />
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-[#1e2d45] bg-[#0A1628] p-6 text-center sm:p-8">
        <p className="text-base text-zinc-300">{FIX_IT_PLANS_META.freeSwingCta}</p>
        <button
          type="button"
          disabled={busySlug === "free-swing-analysis"}
          onClick={() => void handleFreeSwing()}
          className="mt-5 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-[#2D6A4F] px-6 py-3 text-sm font-semibold text-white hover:bg-[#52B788] disabled:opacity-70 sm:w-auto"
        >
          Get My Free Swing Analysis
        </button>
      </section>

      <section className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">Why these work</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{FIX_IT_PLANS_META.whyTheseWork}</p>
        <p className="mt-4 text-sm text-zinc-400">{FIX_IT_PLANS_META.scheduleNote}</p>
      </section>

      {leadResource ? (
        <ResourceLeadModal resource={leadResource} onClose={() => setLeadResource(null)} />
      ) : null}
    </>
  );
}
