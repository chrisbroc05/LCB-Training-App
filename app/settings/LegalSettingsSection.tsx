"use client";

import Link from "next/link";
import { useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import { settingsLabelClass } from "@/app/settings/settings-styles";
import { formatDateTime } from "@/lib/format-date";
import {
  formatLegalAgreementRole,
  formatMediaConsentLabel,
  LEGAL_PAGE_PATHS,
} from "@/lib/legal-shared";

type LegalSettingsSectionProps = {
  termsVersion: string | null;
  termsAcceptedAt: string | null;
  acceptedByName: string | null;
  acceptedAsParent: boolean;
  mediaConsent: boolean;
};

export default function LegalSettingsSection({
  termsVersion,
  termsAcceptedAt,
  acceptedByName,
  acceptedAsParent,
  mediaConsent: initialMediaConsent,
}: LegalSettingsSectionProps) {
  const [mediaConsent, setMediaConsent] = useState(initialMediaConsent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleMediaConsentChange = async (nextValue: boolean) => {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/settings/media-consent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaConsent: nextValue }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to update media consent.");
      setSaving(false);
      return;
    }

    setMediaConsent(nextValue);
    setSuccess("Media consent updated.");
    setSaving(false);
  };

  return (
    <SettingsCard
      title="Legal and privacy"
      description="Review our policies and manage media consent for sharing your videos."
    >
      <div className="space-y-2 text-sm text-zinc-300">
        <p>
          <span className={settingsLabelClass}>Terms accepted:</span>{" "}
          {termsVersion ?? "Not yet accepted"}
          {termsAcceptedAt ? ` on ${formatDateTime(termsAcceptedAt)}` : ""}
        </p>
        {acceptedByName ? (
          <p>
            <span className={settingsLabelClass}>Agreed by:</span> {acceptedByName} (
            {formatLegalAgreementRole(acceptedAsParent)})
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href={LEGAL_PAGE_PATHS.terms} className="font-semibold text-[#52B788]">
          Terms of Service
        </Link>
        <Link href={LEGAL_PAGE_PATHS.privacy} className="font-semibold text-[#52B788]">
          Privacy Policy
        </Link>
        <Link href={LEGAL_PAGE_PATHS.waiver} className="font-semibold text-[#52B788]">
          Waiver
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-[#2b3650] bg-black/30 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={mediaConsent}
            disabled={saving}
            onChange={(event) => void handleMediaConsentChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className="text-sm text-zinc-300">
            OK for Coach Broc to share my videos on LCB Training social media and website. Current
            setting: {formatMediaConsentLabel(mediaConsent)}.
          </span>
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-[#9df3bd]">{success}</p> : null}
    </SettingsCard>
  );
}
