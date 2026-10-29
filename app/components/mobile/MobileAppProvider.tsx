"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import type { DatabaseTier } from "@/lib/membership";
import { PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL } from "@/lib/membership-levels-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

type MobileAppContextValue = {
  openUpgradeSheet: (message?: string) => void;
  closeUpgradeSheet: () => void;
};

const MobileAppContext = createContext<MobileAppContextValue | null>(null);

type MobileAppProviderProps = {
  children: React.ReactNode;
  membershipTier: DatabaseTier;
  currentPlanLabel: string;
  hasPlaybookAccess: boolean;
  hasProgramEnrollment?: boolean;
};

export function MobileAppProvider({
  children,
  membershipTier,
  currentPlanLabel,
  hasPlaybookAccess,
  hasProgramEnrollment = false,
}: MobileAppProviderProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const openUpgradeSheet = useCallback(
    (message?: string) => {
      if (hasProgramEnrollment) {
        return;
      }

      setUpgradeMessage(message ?? null);
      setUpgradeOpen(true);
    },
    [hasProgramEnrollment],
  );

  const closeUpgradeSheet = useCallback(() => {
    setUpgradeOpen(false);
    setUpgradeMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      openUpgradeSheet,
      closeUpgradeSheet,
    }),
    [openUpgradeSheet, closeUpgradeSheet],
  );

  const defaultMessage = hasPlaybookAccess
    ? "Join the 12-Week Coaching Program for personal coaching from Coach Broc."
    : `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock ${PLAYBOOK_NAME}, the drill library, and training resources.`;

  return (
    <MobileAppContext.Provider value={value}>
      {children}
      {!hasProgramEnrollment ? (
        <MobileBottomSheet
          open={upgradeOpen}
          onClose={closeUpgradeSheet}
          title="Upgrade Membership"
          footer={
            <div className="flex flex-col gap-3">
              <Link
                href="/upgrade"
                onClick={closeUpgradeSheet}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#22c55e] px-5 text-sm font-semibold text-[#0A1628] transition hover:bg-[#35db72]"
              >
                View Upgrade Options
              </Link>
              <button
                type="button"
                onClick={closeUpgradeSheet}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#2b3650] px-5 text-sm font-semibold text-zinc-300 transition hover:border-[#52B788] hover:text-[#98b144]"
              >
                Not Now
              </button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-zinc-300">
            {upgradeMessage ?? defaultMessage}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Current plan: {currentPlanLabel}
          </p>
        </MobileBottomSheet>
      ) : null}
    </MobileAppContext.Provider>
  );
}

export function useMobileApp() {
  const context = useContext(MobileAppContext);
  if (!context) {
    throw new Error("useMobileApp must be used within MobileAppProvider");
  }
  return context;
}

export function useOptionalMobileApp() {
  return useContext(MobileAppContext);
}
