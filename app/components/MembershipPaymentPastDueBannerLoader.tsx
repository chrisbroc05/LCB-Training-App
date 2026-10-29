"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MembershipPaymentPastDueBanner from "@/app/components/MembershipPaymentPastDueBanner";

type BannerPayload = {
  levelLabel: string;
  graceEndsLabel: string;
};

type Props = {
  enabled: boolean;
};

export default function MembershipPaymentPastDueBannerLoader({ enabled }: Props) {
  const pathname = usePathname();
  const [banner, setBanner] = useState<BannerPayload | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBanner(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/membership/payment-banner", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (cancelled) {
        return;
      }
      if (!response.ok) {
        setBanner(null);
        return;
      }
      const data = (await response.json().catch(() => null)) as BannerPayload | null;
      if (!data?.levelLabel || !data.graceEndsLabel) {
        setBanner(null);
        return;
      }
      setBanner(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, pathname]);

  if (!banner) {
    return null;
  }

  return (
    <MembershipPaymentPastDueBanner
      levelLabel={banner.levelLabel}
      graceEndsLabel={banner.graceEndsLabel}
    />
  );
}
