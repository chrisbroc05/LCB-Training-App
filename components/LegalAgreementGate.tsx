"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LegalAgreementFields, {
  buildLegalAcceptancePayload,
  createEmptyLegalAgreementValues,
  validateLegalAgreementValues,
  type LegalAgreementValues,
} from "@/components/LegalAgreementFields";
import { isLegalPublicPath } from "@/lib/legal-shared";

type LegalStatus = {
  needsAcceptance: boolean;
  currentVersion: string;
};

export default function LegalAgreementGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<LegalStatus | null>(null);
  const [values, setValues] = useState<LegalAgreementValues>(createEmptyLegalAgreementValues());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLegalPublicPath(pathname)) {
      setStatus({ needsAcceptance: false, currentVersion: "" });
      return;
    }

    let cancelled = false;

    void fetch("/api/legal/status")
      .then((response) => response.json())
      .then((data: LegalStatus & { error?: string }) => {
        if (!cancelled) {
          setStatus({
            needsAcceptance: Boolean(data.needsAcceptance),
            currentVersion: data.currentVersion ?? "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ needsAcceptance: false, currentVersion: "" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!status?.needsAcceptance || isLegalPublicPath(pathname)) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validationError = validateLegalAgreementValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = buildLegalAcceptancePayload(values);
    if (!payload) {
      setLoading(false);
      setError("Enter a valid player age (5-25).");
      return;
    }

    const response = await fetch("/api/legal/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "Unable to save your agreement.");
      return;
    }

    setStatus({ needsAcceptance: false, currentVersion: status.currentVersion });
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#02060f]/95 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#18243a] bg-[#0b1324] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Updated agreement required</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Our Terms of Service, Privacy Policy, or Waiver have been updated. Please review and
          agree before continuing.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <LegalAgreementFields values={values} onChange={setValues} error={error} />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Agree and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
