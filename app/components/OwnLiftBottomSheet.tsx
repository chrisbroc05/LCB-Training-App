"use client";

import { useState } from "react";
import ProgramNoteField from "@/app/components/ProgramNoteField";
import {
  OWN_LIFT_NOTE_PLACEHOLDER,
  OWN_LIFT_SHEET_TITLE,
  TASK_COMPLETION_TYPE_OWN_LIFT,
  canSaveOwnLiftNote,
} from "@/lib/program-task-completion-shared";

type OwnLiftBottomSheetProps = {
  programDay: number;
  taskKey: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function OwnLiftBottomSheet({
  programDay,
  taskKey,
  onClose,
  onSaved,
}: OwnLiftBottomSheetProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");

    const response = await fetch("/api/program/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programDay,
        taskKey,
        note,
        completionType: TASK_COMPLETION_TYPE_OWN_LIFT,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save.");
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#18243a] bg-[#0b1324] p-5 shadow-2xl">
        <p className="text-xl font-semibold leading-snug text-zinc-100">{OWN_LIFT_SHEET_TITLE}</p>
        <div className="mt-4">
          <ProgramNoteField
            value={note}
            onChange={setNote}
            placeholder={OWN_LIFT_NOTE_PLACEHOLDER}
            maxLength={500}
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || !canSaveOwnLiftNote(note)}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#2D6A4F] text-base font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
