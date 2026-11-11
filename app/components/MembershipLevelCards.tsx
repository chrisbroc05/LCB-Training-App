"use client";

import { useState } from "react";
import Link from "next/link";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import MembershipLevelCheckoutButton from "@/app/components/MembershipLevelCheckoutButton";
import MembershipLevelSignupLink from "@/app/components/MembershipLevelSignupLink";
import type { BillingFrequency } from "@/lib/billing";
import {
  ANNUAL_MEMBERSHIP_REFUND_POLICY_SHORT,
  getMembershipLevelPriceDisplay,
  membershipLevelSupportsAnnualBilling,
  parseMembershipBillingInterval,
} from "@/lib/membership-billing-shared";
import {
  chooseMembershipLevelButtonLabel,
  formatMembershipComparisonCell,
  listMembershipComparisonColumns,
  listMembershipComparisonRows,
  listMembershipStepUpCards,
  MEMBERSHIP_COMPARISON_SUBTITLE,
  type MembershipFoundingPlusHighlight,
} from "@/lib/membership-comparison-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export type MembershipLevelCardsMode = "dashboard" | "upgrade" | "public";

type MembershipLevelCardsProps = {
  mode: MembershipLevelCardsMode;
  currentLevel?: MembershipLevelKey | null;
  selectedLevel?: MembershipLevelKey | null;
  foundingPlusHighlight?: MembershipFoundingPlusHighlight | null;
  signedIn?: boolean;
  allAccessAvailable?: boolean;
  clubOrgName?: string | null;
  showSubtitle?: boolean;
  title?: string | null;
};

function CellValue({
  value,
}: {
  value: ReturnType<typeof listMembershipComparisonRows>[number]["cells"]["CORE"];
}) {
  if (value.kind === "check") {
    return <span className="font-semibold text-[#52B788]">Yes</span>;
  }
  if (value.kind === "dash") {
    return <span className="text-zinc-500">-</span>;
  }
  return <span className="text-zinc-200">{formatMembershipComparisonCell(value)}</span>;
}

export default function MembershipLevelCards({
  mode,
  currentLevel = null,
  selectedLevel = null,
  foundingPlusHighlight = null,
  signedIn = false,
  allAccessAvailable = true,
  clubOrgName = null,
  showSubtitle = true,
  title = null,
}: MembershipLevelCardsProps) {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");
  const [compareOpen, setCompareOpen] = useState(false);
  const billingInterval = parseMembershipBillingInterval(billingFrequency);
  const cards = listMembershipStepUpCards();
  const showFounding =
    Boolean(foundingPlusHighlight) && billingInterval === "MONTHLY" && signedIn;

  return (
    <div className="space-y-6">
      {title || showSubtitle ? (
        <div className="text-center">
          {title ? (
            <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">{title}</h2>
          ) : null}
          {showSubtitle ? (
            <p className={`text-sm text-zinc-300 sm:text-base ${title ? "mt-2" : ""}`}>
              {MEMBERSHIP_COMPARISON_SUBTITLE}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>
      {billingFrequency === "annual" ? (
        <p className="text-center text-xs text-zinc-400">{ANNUAL_MEMBERSHIP_REFUND_POLICY_SHORT}</p>
      ) : null}

      <div className="grid items-stretch gap-4 sm:gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const isCurrent = currentLevel === card.key;
          const isSelected = selectedLevel === card.key;
          const supportsAnnual = membershipLevelSupportsAnnualBilling(card.key);
          const intervalForCard =
            supportsAnnual && billingInterval === "ANNUAL" ? "ANNUAL" : "MONTHLY";
          const priceDisplay = getMembershipLevelPriceDisplay(card.key, intervalForCard);
          const showPlusFounding = card.key === "PLUS" && showFounding && foundingPlusHighlight;

          return (
            <article
              key={card.key}
              className={`flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
                card.recommended || isSelected
                  ? "border-[#52B788]/55 bg-[#22c55e]/10 shadow-lg shadow-black/20"
                  : "border-[#18243a] bg-[#0b1324]/80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-zinc-100">{card.displayName}</h3>
                {card.recommended ? (
                  <span className="rounded-full bg-[#22c55e]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                    Recommended
                  </span>
                ) : null}
                {isCurrent ? (
                  <span className="rounded-full bg-[#24314a] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-200">
                    Your plan
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-2xl font-bold text-[#98b144]">{priceDisplay}</p>
              {!supportsAnnual && billingInterval === "ANNUAL" ? (
                <p className="mt-1 text-xs text-zinc-500">Monthly billing only</p>
              ) : null}

              {showPlusFounding ? (
                <p className="mt-3 text-xs font-medium leading-snug text-[#9df3bd]">
                  {foundingPlusHighlight!.line}
                </p>
              ) : null}

              {card.includesPriorLabel ? (
                <p className="mt-4 text-sm font-semibold text-zinc-200">{card.includesPriorLabel}</p>
              ) : (
                <p className="mt-4 text-sm font-semibold text-zinc-200">Includes:</p>
              )}

              <ul className="mt-2 flex-1 space-y-2 text-sm leading-relaxed text-zinc-300">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1 text-[#52B788]" aria-hidden>
                      -
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <CardAction
                  level={card.key}
                  mode={mode}
                  isCurrent={isCurrent}
                  signedIn={signedIn}
                  billingInterval={intervalForCard}
                  allAccessAvailable={allAccessAvailable}
                  clubOrgName={clubOrgName}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setCompareOpen((open) => !open)}
          className="text-sm font-semibold text-[#98b144] underline-offset-2 hover:underline"
        >
          {compareOpen ? "Hide feature comparison" : "Compare all features"}
        </button>
      </div>

      {compareOpen ? <MembershipComparisonDetailGrid /> : null}
    </div>
  );
}

function MembershipComparisonDetailGrid() {
  const columns = listMembershipComparisonColumns();
  const rows = listMembershipComparisonRows();

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#18243a] bg-[#0b1324]/60 p-3 sm:p-4">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#2b3650]">
            <th className="py-2 pr-3 font-semibold text-zinc-400">Feature</th>
            {columns.map((column) => (
              <th key={column.key} className="px-2 py-2 font-semibold text-zinc-100">
                {column.displayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#1e2d45]">
              <td className="py-2 pr-3 text-zinc-300">{row.label}</td>
              {columns.map((column) => (
                <td key={`${row.id}-${column.key}`} className="px-2 py-2">
                  <CellValue value={row.cells[column.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardAction(props: {
  level: MembershipLevelKey;
  mode: MembershipLevelCardsMode;
  isCurrent: boolean;
  signedIn: boolean;
  billingInterval: "MONTHLY" | "ANNUAL";
  allAccessAvailable: boolean;
  clubOrgName: string | null;
}) {
  const label = chooseMembershipLevelButtonLabel(props.level);
  const buttonClass =
    "inline-flex h-12 w-full items-center justify-center rounded-full bg-[#22c55e] px-5 text-sm font-semibold text-black transition hover:bg-[#35db72]";

  if (props.isCurrent) {
    return (
      <div className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#52B788]/40 bg-[#22c55e]/10 px-5 text-sm font-semibold text-[#9df3bd]">
        Your plan
      </div>
    );
  }

  if (props.mode === "dashboard") {
    return (
      <Link href={`/upgrade?level=${props.level}`} className={buttonClass}>
        {label}
      </Link>
    );
  }

  if (!props.signedIn) {
    return (
      <MembershipLevelSignupLink
        level={props.level}
        billingInterval={props.billingInterval}
        label={label}
        className={buttonClass}
      />
    );
  }

  return (
    <MembershipLevelCheckoutButton
      level={props.level}
      billingInterval={props.billingInterval}
      label={label}
      showOrgCode={!props.clubOrgName}
      clubOrgName={props.clubOrgName}
      capFullWaitlist={props.level === "ALL_ACCESS" && !props.allAccessAvailable}
      className="w-full [&_button]:h-12"
    />
  );
}
