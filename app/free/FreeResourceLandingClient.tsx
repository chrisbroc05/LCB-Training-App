"use client";

import { useEffect, useState } from "react";
import ResourceLeadCaptureForm from "@/app/resources/ResourceLeadCaptureForm";
import {
  postResourceLeadAction,
  readLeadIdFromCookie,
} from "@/lib/resources-lead-client";
import type { ResourceLeadActionResult } from "@/lib/resources-lead-shared";
import type { ResourceDefinition } from "@/lib/resources-shared";

type FreeResourceLandingClientProps = {
  resource: ResourceDefinition;
  leadSource: string;
  isLoggedIn: boolean;
};

export default function FreeResourceLandingClient({
  resource,
  leadSource,
  isLoggedIn,
}: FreeResourceLandingClientProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [existingLeadId, setExistingLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setExistingLeadId(readLeadIdFromCookie());
    }
  }, [isLoggedIn]);

  const handleResult = (result: ResourceLeadActionResult) => {
    if (result.action === "download") {
      setDownloadUrl(result.downloadUrl);
      return;
    }
    if (result.action === "checkout" || result.action === "redirect") {
      window.location.href = result.url;
    }
  };

  const runOneTap = async () => {
    setError("");
    setBusy(true);
    try {
      const leadId = isLoggedIn ? undefined : existingLeadId ?? undefined;
      const result = await postResourceLeadAction({
        resourceSlug: resource.slug,
        source: leadSource,
        ...(leadId ? { leadId } : {}),
      });
      handleResult(result as ResourceLeadActionResult);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  if (downloadUrl) {
    return (
      <div className="mt-8 rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/10 p-5 sm:p-6">
        <p className="text-lg font-semibold text-zinc-100">Your PDF is ready</p>
        <p className="mt-2 text-sm text-zinc-300">
          We also emailed you a download link. Use the button below to open it now.
        </p>
        <a
          href={downloadUrl}
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
        >
          Download PDF
        </a>
      </div>
    );
  }

  if (isLoggedIn || existingLeadId) {
    return (
      <div className="mt-8">
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => void runOneTap()}
          disabled={busy}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60 sm:w-auto"
        >
          {busy
            ? "Preparing..."
            : isLoggedIn
              ? "Download / email PDF"
              : resource.buttonLabel}
        </button>
        {!isLoggedIn ? (
          <p className="mt-3 text-xs text-zinc-500">
            We already have your details. One tap sends the PDF to your email and opens the
            download.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Get the free PDF</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Enter your details. We show the download here and email the PDF.
      </p>
      <ResourceLeadCaptureForm
        className="mt-5"
        resource={resource}
        source={leadSource}
        onSuccess={handleResult}
      />
    </div>
  );
}
