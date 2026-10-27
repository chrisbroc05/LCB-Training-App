"use client";

import Link from "next/link";
import DigitalProductSalesFinalNotice from "@/app/resources/DigitalProductSalesFinalNotice";
import type { ResourceDefinition } from "@/lib/resources-shared";
import type { ResourceHubMemberOverride } from "@/lib/resources-hub-member-shared";

type ResourceCardProps = {
  resource: ResourceDefinition;
  onAction: (resource: ResourceDefinition) => void;
  memberOverride?: ResourceHubMemberOverride | null;
};

export default function ResourceCard({ resource, onAction, memberOverride }: ResourceCardProps) {
  const isPaid = resource.tag === "PAID" && !memberOverride?.hidePrice;
  const showIncluded = Boolean(memberOverride);

  return (
    <article
      className={
        isPaid
          ? "group flex h-full flex-col rounded-2xl border border-[#52B788]/40 bg-[#0d1c31] p-5 shadow-lg shadow-black/20 transition-colors hover:border-[#52B788] active:border-[#52B788]"
          : "flex h-full flex-col rounded-2xl border border-[#1e2d45] bg-[#0A1628] p-5 shadow-lg shadow-black/20"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            showIncluded || resource.tag === "FREE"
              ? "rounded-full bg-[#52B788]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#52B788]"
              : "rounded-full bg-[#52B788] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#0A1628]"
          }
        >
          {showIncluded ? "Included" : resource.tag}
        </span>
        {resource.badge ? (
          <span className="rounded-full border border-zinc-400/50 bg-transparent px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
            {resource.badge}
          </span>
        ) : null}
        {resource.priceDisplay && !memberOverride?.hidePrice ? (
          <span className="ml-auto text-sm font-semibold text-zinc-200">{resource.priceDisplay}</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-white">{resource.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-300">{resource.description}</p>

      {memberOverride ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#52B788]">
          {memberOverride.includedLabel}
        </p>
      ) : null}

      {memberOverride ? (
        <Link
          href={memberOverride.href}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#52B788] hover:text-[#0A1628] group-hover:bg-[#52B788] group-hover:text-[#0A1628]"
        >
          {memberOverride.buttonLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onAction(resource)}
          className="mt-5 min-h-[48px] w-full rounded-full bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#52B788] hover:text-[#0A1628] group-hover:bg-[#52B788] group-hover:text-[#0A1628]"
        >
          {resource.buttonLabel}
        </button>
      )}
      {resource.type === "PAID_DOWNLOAD" ? <DigitalProductSalesFinalNotice className="mt-2 text-center text-xs leading-relaxed text-zinc-500" /> : null}
    </article>
  );
}
