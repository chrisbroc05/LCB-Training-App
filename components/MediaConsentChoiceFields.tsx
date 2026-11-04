"use client";

import {
  MEDIA_CONSENT_OPTION_NO,
  MEDIA_CONSENT_OPTION_YES,
  MEDIA_CONSENT_POLICY_INTRO,
} from "@/lib/media-consent-shared";

type MediaConsentChoiceFieldsProps = {
  mediaConsent: boolean;
  onChange: (mediaConsent: boolean) => void;
  disabled?: boolean;
  namePrefix?: string;
};

export default function MediaConsentChoiceFields({
  mediaConsent,
  onChange,
  disabled = false,
  namePrefix = "mediaConsent",
}: MediaConsentChoiceFieldsProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-200">Photos and videos</legend>
      <p className="text-sm leading-relaxed text-zinc-400">{MEDIA_CONSENT_POLICY_INTRO}</p>
      <label className="flex items-start gap-3">
        <input
          type="radio"
          name={`${namePrefix}-choice`}
          checked={mediaConsent === true}
          disabled={disabled}
          onChange={() => onChange(true)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
        />
        <span className="text-sm text-zinc-300">{MEDIA_CONSENT_OPTION_YES}</span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="radio"
          name={`${namePrefix}-choice`}
          checked={mediaConsent === false}
          disabled={disabled}
          onChange={() => onChange(false)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
        />
        <span className="text-sm text-zinc-300">{MEDIA_CONSENT_OPTION_NO}</span>
      </label>
    </fieldset>
  );
}
