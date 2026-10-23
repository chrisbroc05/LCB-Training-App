/**
 * Admin toggle: free-tier swing analysis delivery (client-safe).
 */

export const FREE_SWING_ANALYSIS_RESPONSE_MODES = ["VIDEO", "WRITTEN_REPORT"] as const;

export type FreeSwingAnalysisResponseMode = (typeof FREE_SWING_ANALYSIS_RESPONSE_MODES)[number];

export const DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE: FreeSwingAnalysisResponseMode = "VIDEO";

export const FREE_SWING_ANALYSIS_RESPONSE_OPTIONS: {
  value: FreeSwingAnalysisResponseMode;
  label: string;
}[] = [
  { value: "VIDEO", label: "Video (default)" },
  { value: "WRITTEN_REPORT", label: "Written report" },
];

export function parseFreeSwingAnalysisResponseMode(
  value: unknown,
): { ok: true; mode: FreeSwingAnalysisResponseMode } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!(FREE_SWING_ANALYSIS_RESPONSE_MODES as readonly string[]).includes(raw)) {
    return { ok: false, error: "Invalid free swing analysis response mode." };
  }
  return { ok: true, mode: raw as FreeSwingAnalysisResponseMode };
}
