"use client";

import { useCallback, useMemo, useState } from "react";

type PreviewRow = {
  id: string;
  email: string;
  firstName: string;
  source: string;
  createdAt: string;
};

type Preview = {
  eligibleCount: number;
  alreadySentCount: number;
  excludedCount: number;
  leads: PreviewRow[];
  blockedMissingAddress: boolean;
  marketingStartAt: string | null;
};

export default function AdminLegacyLeadInvitePanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectableLeads = useMemo(() => preview?.leads ?? [], [preview]);

  const syncCheckedFromPreview = useCallback((nextPreview: Preview) => {
    setCheckedIds(new Set(nextPreview.leads.map((row) => row.id)));
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads/legacy-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", listLimit: 50 }),
      });
      const data = (await response.json()) as { preview?: Preview; error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Preview failed.");
        return;
      }
      const nextPreview = data.preview ?? null;
      setPreview(nextPreview);
      if (nextPreview) {
        syncCheckedFromPreview(nextPreview);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (leadId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setCheckedIds(new Set(selectableLeads.map((row) => row.id)));
    } else {
      setCheckedIds(new Set());
    }
  };

  const excludeLead = async (leadId: string) => {
    const reason = window.prompt(
      "Exclude reason (optional). This lead will never receive lead marketing email.",
      "manual_admin_exclude",
    );
    if (reason === null) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads/legacy-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exclude", leadId, reason: reason.trim() || undefined }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Exclude failed.");
        return;
      }
      setMessage("Lead excluded from marketing.");
      await loadPreview();
    } finally {
      setLoading(false);
    }
  };

  const sendBatch = async () => {
    const ids = [...checkedIds];
    if (ids.length === 0) {
      setMessage("Select at least one lead.");
      return;
    }
    if (
      !window.confirm(
        `Send the one-time legacy lead invite to ${ids.length} selected lead(s)?`,
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads/legacy-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", confirm: true, leadIds: ids }),
      });
      const data = (await response.json()) as {
        sent?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Send failed.");
        return;
      }
      setMessage(`Sent ${data.sent ?? 0}, skipped ${data.skipped ?? 0}.`);
      if (data.errors?.length) {
        setMessage((prev) => `${prev} Errors: ${data.errors!.join("; ")}`);
      }
      await loadPreview();
    } finally {
      setLoading(false);
    }
  };

  const allSelectableChecked =
    selectableLeads.length > 0 && selectableLeads.every((row) => checkedIds.has(row.id));

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Legacy lead one-time invite</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Automated day-3 lead email only runs for leads created on or after{" "}
        <code className="text-zinc-300">MARKETING_EMAILS_START_AT</code>. Use this to preview and
        manually send the legacy one-time invite to older leads (deduped per lead).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPreview()}
          className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-50"
        >
          Preview eligible leads
        </button>
        <button
          type="button"
          disabled={
            loading ||
            !preview ||
            preview.eligibleCount === 0 ||
            preview.blockedMissingAddress ||
            checkedIds.size === 0
          }
          onClick={() => void sendBatch()}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Send selected ({checkedIds.size})
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
      {preview ? (
        <div className="mt-4 text-sm text-zinc-400">
          <p>
            Eligible: {preview.eligibleCount} | Already sent legacy invite:{" "}
            {preview.alreadySentCount} | Excluded: {preview.excludedCount}
          </p>
          {preview.blockedMissingAddress ? (
            <p className="mt-2 text-yellow-200">COMPANY_MAILING_ADDRESS is not set on this server.</p>
          ) : null}
          {preview.marketingStartAt ? (
            <p className="mt-1">Marketing start: {preview.marketingStartAt}</p>
          ) : (
            <p className="mt-2 text-yellow-200">MARKETING_EMAILS_START_AT is not set.</p>
          )}
          {preview.leads.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-[#18243a]">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead className="sticky top-0 bg-[#0b1324] text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={allSelectableChecked}
                        disabled={selectableLeads.length === 0 || loading}
                        onChange={(event) => toggleAll(event.target.checked)}
                        aria-label="Select all leads in list"
                      />
                    </th>
                    <th className="px-2 py-2">Lead</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.leads.map((row) => (
                    <tr key={row.id} className="border-t border-[#18243a]">
                      <td className="px-2 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={checkedIds.has(row.id)}
                          disabled={loading}
                          onChange={(event) => toggleLead(row.id, event.target.checked)}
                          aria-label={`Select ${row.email}`}
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <p className="text-zinc-300">{row.email}</p>
                        <p className="text-zinc-500">
                          {row.firstName} | {row.source} | {row.createdAt.slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void excludeLead(row.id)}
                          className="text-red-300 underline disabled:opacity-50"
                        >
                          Exclude
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
