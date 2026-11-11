"use client";

import ResourceLeadCaptureForm from "@/app/resources/ResourceLeadCaptureForm";
import { followResourceLeadAction } from "@/lib/resources-lead-client";
import type { ResourceLeadActionResult } from "@/lib/resources-lead-shared";
import type { ResourceDefinition } from "@/lib/resources-shared";

type ResourceLeadModalProps = {
  resource: ResourceDefinition;
  onClose: () => void;
  onSuccess?: (result: ResourceLeadActionResult) => void;
  source?: string | null;
};

export default function ResourceLeadModal({
  resource,
  onClose,
  onSuccess,
  source,
}: ResourceLeadModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        className="w-full max-w-md rounded-t-3xl border border-[#1e2d45] bg-[#0b1324] p-5 pb-8 shadow-2xl sm:rounded-2xl sm:pb-5"
        role="dialog"
        aria-labelledby="resource-lead-title"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#2b3650] sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#52B788]">{resource.title}</p>
            <h2 id="resource-lead-title" className="mt-1 text-lg font-semibold text-white">
              Quick details before you continue
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="mt-5">
          <ResourceLeadCaptureForm
            resource={resource}
            source={source}
            onSuccess={(result) => {
              if (onSuccess) {
                onSuccess(result);
              } else {
                followResourceLeadAction(result);
              }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
