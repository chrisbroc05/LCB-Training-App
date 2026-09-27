"use client";

import {
  LOW_EFFORT_NOTE_MESSAGE,
  MAX_DAY_LOG_NOTE_LENGTH,
  MAX_TASK_NOTE_LENGTH,
  MIN_PROGRAM_NOTE_LENGTH,
  PROGRAM_NOTE_REMINDER,
  isLowEffortNote,
} from "@/lib/program-note-shared";

type ProgramNoteFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
  rows?: number;
  id?: string;
};

export default function ProgramNoteField({
  value,
  onChange,
  placeholder,
  maxLength = MAX_TASK_NOTE_LENGTH,
  rows = 4,
  id,
}: ProgramNoteFieldProps) {
  const trimmedLength = value.trim().length;
  const showLowEffort = isLowEffortNote(value);

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">{PROGRAM_NOTE_REMINDER}</p>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-zinc-100"
      />
      <div className="flex items-start justify-between gap-3">
        {showLowEffort ? (
          <p className="text-xs text-red-300">{LOW_EFFORT_NOTE_MESSAGE}</p>
        ) : (
          <span className="text-xs text-transparent">.</span>
        )}
        <span
          className={`shrink-0 text-xs font-medium ${
            trimmedLength >= MIN_PROGRAM_NOTE_LENGTH ? "text-[#9df3bd]" : "text-zinc-500"
          }`}
        >
          {trimmedLength}/{MIN_PROGRAM_NOTE_LENGTH}
        </span>
      </div>
    </div>
  );
}

export { MAX_DAY_LOG_NOTE_LENGTH, MAX_TASK_NOTE_LENGTH };
