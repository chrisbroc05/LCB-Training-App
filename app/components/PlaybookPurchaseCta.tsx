"use client";

import Link from "next/link";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import {
  PLAYBOOK_PURCHASE_BUTTON_LABEL,
  PLAYBOOK_PURCHASE_PRICE_SUBTITLE,
} from "@/lib/playbook-branding";

type PlaybookPurchaseCtaProps = {
  href?: string;
  useCheckout?: boolean;
  align?: "left" | "center";
  buttonClassName?: string;
  subtitleClassName?: string;
};

const defaultButtonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto";

const defaultSubtitleClassName = "mt-2 text-xs text-zinc-400";

export default function PlaybookPurchaseCta({
  href = "/auth?tier=basic",
  useCheckout = false,
  align = "left",
  buttonClassName = defaultButtonClassName,
  subtitleClassName = defaultSubtitleClassName,
}: PlaybookPurchaseCtaProps) {
  const alignmentClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col ${alignmentClass}`}>
      {useCheckout ? (
        <div className="w-full [&_button]:w-full sm:[&_button]:w-auto">
          <UpgradeActions tier="BASIC" buttonLabel={PLAYBOOK_PURCHASE_BUTTON_LABEL} />
        </div>
      ) : (
        <Link href={href} className={buttonClassName}>
          {PLAYBOOK_PURCHASE_BUTTON_LABEL}
        </Link>
      )}
      <p className={subtitleClassName}>{PLAYBOOK_PURCHASE_PRICE_SUBTITLE}</p>
    </div>
  );
}
