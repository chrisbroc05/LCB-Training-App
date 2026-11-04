export const MEDIA_CONSENT_POLICY_INTRO =
  "Group training footage (team sessions, clinics, drills with multiple players) is part of LCB Training programs and may be shared on LCB Training's website and social media. Media consent below covers close-ups, one-on-one clips, and using your player's name.";

export const MEDIA_CONSENT_OPTION_YES =
  "Yes: close-ups, one-on-one clips, and first name are OK.";

export const MEDIA_CONSENT_OPTION_NO =
  "No: group footage only. No close-ups, one-on-one clips, or name.";

export type MediaDisplayStatus = "YES" | "GROUP_ONLY" | "KEEP_OUT";

export type MediaDisplayFilter = "ALL" | MediaDisplayStatus;

export const MEDIA_DISPLAY_FILTER_OPTIONS: Array<{ value: MediaDisplayFilter; label: string }> = [
  { value: "ALL", label: "All media" },
  { value: "YES", label: "Yes" },
  { value: "GROUP_ONLY", label: "Group only" },
  { value: "KEEP_OUT", label: "Keep out" },
];

export function resolveMediaDisplayStatus(params: {
  mediaConsent: boolean;
  mediaOptOutAll: boolean;
}): MediaDisplayStatus {
  if (params.mediaOptOutAll) {
    return "KEEP_OUT";
  }
  if (params.mediaConsent) {
    return "YES";
  }
  return "GROUP_ONLY";
}

export function formatMediaDisplayStatusLabel(status: MediaDisplayStatus) {
  switch (status) {
    case "YES":
      return "Yes";
    case "GROUP_ONLY":
      return "Group only";
    case "KEEP_OUT":
      return "Keep out";
  }
}

export function formatMediaConsentLabel(params: {
  mediaConsent: boolean;
  mediaOptOutAll?: boolean;
}) {
  return formatMediaDisplayStatusLabel(
    resolveMediaDisplayStatus({
      mediaConsent: params.mediaConsent,
      mediaOptOutAll: params.mediaOptOutAll ?? false,
    }),
  );
}

export function mediaDisplayStatusMatchesFilter(
  status: MediaDisplayStatus,
  filter: MediaDisplayFilter,
) {
  if (filter === "ALL") {
    return true;
  }
  return status === filter;
}

export function mediaBadgeClassName(status: MediaDisplayStatus) {
  switch (status) {
    case "YES":
      return "bg-[#22c55e]/15 text-[#86efac] border-[#22c55e]/40";
    case "GROUP_ONLY":
      return "bg-amber-500/15 text-amber-200 border-amber-500/40";
    case "KEEP_OUT":
      return "bg-red-500/15 text-red-200 border-red-500/40";
  }
}
