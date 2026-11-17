import { COACH_TEXT_FORMATTING_TIP } from "@/lib/coach-text-format-shared";

type CoachTextFormattingHintProps = {
  className?: string;
};

export default function CoachTextFormattingHint({ className }: CoachTextFormattingHintProps) {
  return (
    <p className={["mt-1 text-xs text-zinc-500", className].filter(Boolean).join(" ")}>
      {COACH_TEXT_FORMATTING_TIP}
    </p>
  );
}
