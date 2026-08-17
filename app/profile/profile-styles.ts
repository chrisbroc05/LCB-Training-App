export const profileCardClass =
  "rounded-xl border border-[#18243a] bg-[#0b1324]/80 p-6";

export const profilePageStackClass = "flex flex-col gap-6";

export const profilePageTitleClass =
  "text-2xl font-bold leading-tight text-zinc-100 sm:text-3xl";

export const profileSectionTitleClass = "text-lg font-bold text-zinc-100";

export const profileSectionDescriptionClass = "mt-2 text-sm text-zinc-400";

export const profileBodyTextClass = "text-sm text-zinc-300";

export const profileMutedTextClass = "text-sm text-zinc-400";

export const profileLabelClass = "text-xs font-semibold uppercase tracking-wide text-zinc-400";

export const profileValueClass = "mt-1 text-sm text-zinc-100";

export const profilePrimaryButtonClass =
  "inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60";

export const profileSecondaryButtonClass =
  "inline-flex rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60";

export const profileSuccessMessageClass = "text-sm font-medium text-[#9df3bd]";

export const profileErrorMessageClass = "text-sm font-medium text-red-300";

export const tierBadgeStyles = {
  FREE: "border-zinc-500/40 bg-zinc-500/15 text-zinc-200",
  BASIC: "border-blue-400/40 bg-blue-500/15 text-blue-100",
  MEMORABLE: "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#9df3bd]",
  ELITE: "border-yellow-400/40 bg-yellow-500/15 text-yellow-100",
} as const;
