"use client";

import Link from "next/link";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import {
  PLAYBOOK_PURCHASE_BUTTON_LABEL,
  PLAYBOOK_PURCHASE_PRICE_SUBTITLE,
  playbookPrimaryButtonClassName,
  playbookPurchaseSubtitleClassName,
} from "@/lib/playbook-branding";

type PlaybookPurchaseCtaProps = {
  href?: string;
  useCheckout?: boolean;
  align?: "left" | "center";
  buttonClassName?: string;
  subtitleClassName?: string;
  showSubtitle?: boolean;
};

export default function PlaybookPurchaseCta({
  href = "/auth?tier=basic",
  useCheckout = false,
  align = "left",
  buttonClassName = playbookPrimaryButtonClassName,
  subtitleClassName = playbookPurchaseSubtitleClassName,
  showSubtitle = true,
}: PlaybookPurchaseCtaProps) {
  const alignmentClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col ${alignmentClass}`}>
      {useCheckout ? (
        <div className="w-full [&_button]:h-12 [&_button]:w-full [&_button]:px-6 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-white sm:[&_button]:w-auto">
          <UpgradeActions tier="BASIC" buttonLabel={PLAYBOOK_PURCHASE_BUTTON_LABEL} />
        </div>
      ) : (
        <Link href={href} className={buttonClassName}>
          {PLAYBOOK_PURCHASE_BUTTON_LABEL}
        </Link>
      )}
      {showSubtitle ? <p className={subtitleClassName}>{PLAYBOOK_PURCHASE_PRICE_SUBTITLE}</p> : null}
    </div>
  );
}
