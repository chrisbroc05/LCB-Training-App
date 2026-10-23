"use client";

import AdminDrillPicker from "@/app/components/admin/AdminDrillPicker";

type RecommendDrillsPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  maxSelectable?: number;
  title?: string;
  description?: string;
};

export default function RecommendDrillsPicker({
  selectedIds,
  onChange,
  disabled = false,
  maxSelectable = 5,
  title = "Recommend Drills",
  description = "Select up to 5 drills for this player to work on.",
}: RecommendDrillsPickerProps) {
  return (
    <AdminDrillPicker
      selectedIds={selectedIds}
      onChange={onChange}
      disabled={disabled}
      maxSelectable={maxSelectable}
      title={title}
      description={description}
    />
  );
}
