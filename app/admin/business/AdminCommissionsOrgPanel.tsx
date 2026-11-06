"use client";

import { useMemo, useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import Link from "next/link";
import type { AdminCommissionOrgDetail } from "@/lib/admin-commissions-shared";
import { COMMISSION_PAYOUT_METHODS } from "@/lib/admin-commissions-shared";
import { formatAdminCommissionRate } from "@/lib/admin-organizations-shared";
import { formatDateWithYear } from "@/lib/format-date";
import { formatUsdFromCents } from "@/lib/membership-change-shared";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

type AdminCommissionsOrgPanelProps = {
  initialSummary: AdminCommissionOrgDetail;
};

export default function AdminCommissionsOrgPanel({ initialSummary }: AdminCommissionsOrgPanelProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [payoutMonthKey, setPayoutMonthKey] = useState("");
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payoutMethod, setPayoutMethod] = useState<(typeof COMMISSION_PAYOUT_METHODS)[number]>("ACH");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutAmountDollars, setPayoutAmountDollars] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [familyError, setFamilyError] = useState("");
  const [exportMonthKey, setExportMonthKey] = useState(
    summary.monthSummaries.at(-1)?.monthKey ?? "",
  );

  const payableMonthSummaries = useMemo(
    () => summary.monthSummaries.filter((row) => !row.paid && row.amountDueCents > 0),
    [summary.monthSummaries],
  );

  const monthOptions = useMemo(
    () => payableMonthSummaries.map((row) => row.monthKey),
    [payableMonthSummaries],
  );

  const allMonthKeys = useMemo(
    () => summary.monthSummaries.map((row) => row.monthKey),
    [summary.monthSummaries],
  );

  const selectedPayoutMonth = summary.monthSummaries.find((row) => row.monthKey === payoutMonthKey);

  const refreshSummary = (next: AdminCommissionOrgDetail) => {
    setSummary(next);
  };

  const handleMarkPaid = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payoutMonthKey || !selectedPayoutMonth) {
      return;
    }
    setPayoutLoading(true);
    setPayoutError("");
    try {
      const amountCents =
        payoutAmountDollars.trim() === ""
          ? selectedPayoutMonth.amountDueCents
          : Math.round(Number.parseFloat(payoutAmountDollars) * 100);
      const res = await adminFetchJson<{ error?: string; summary?: AdminCommissionOrgDetail }>(
        "/api/admin/commissions/payout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: summary.org.id,
            monthKey: payoutMonthKey,
            paidAt: payoutDate,
            method: payoutMethod,
            note: payoutNote.trim() || null,
            amountCents,
          }),
        },
        { context: "admin-commissions-payout", okUserMessage: "Unable to record payout." },
      );
      if (!res.ok || !res.data.summary) {
        throw new Error(res.ok ? "Unable to record payout." : res.userMessage);
      }
      refreshSummary(res.data.summary);
      setPayoutAmountDollars("");
      setPayoutNote("");
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Unable to record payout.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleFamilyOverride = async (userId: string, countForCommission: boolean, note: string) => {
    setFamilyError("");
    try {
      const res = await adminFetchJson<{ error?: string; summary?: AdminCommissionOrgDetail }>(
        "/api/admin/commissions/override",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            organizationId: summary.org.id,
            countForCommission,
            note: note.trim() || null,
          }),
        },
        { context: "admin-commissions-override", okUserMessage: "Unable to update override." },
      );
      if (!res.ok || !res.data.summary) {
        throw new Error(res.ok ? "Unable to update override." : res.userMessage);
      }
      refreshSummary(res.data.summary);
    } catch (error) {
      setFamilyError(error instanceof Error ? error.message : "Unable to update override.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6 text-sm text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-100">{summary.org.name}</h2>
        {summary.org.commissionRate > 0 ? (
          <p className="mt-2">
            First period: {formatAdminCommissionRate(summary.org.commissionRate)} for{" "}
            {summary.org.commissionMonths} months, then{" "}
            {formatAdminCommissionRate(summary.org.ongoingCommissionRate)} ongoing
            {summary.org.commissionEndsAt
              ? ` (ends ${formatDateWithYear(summary.org.commissionEndsAt)})`
              : ""}
            .
          </p>
        ) : (
          <p className="mt-2 text-zinc-400">No commission configured for this org.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Monthly totals and carryover</h3>
        <div className="admin-table-wrap mt-3">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Month</th>
                <th className="px-2 py-2">Month total</th>
                <th className="px-2 py-2">Carried in</th>
                <th className="px-2 py-2">Combined</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Amount due / balance</th>
              </tr>
            </thead>
            <tbody>
              {summary.monthSummaries.map((row) => (
                <tr key={row.monthKey} className="border-t border-[#18243a]">
                  <td className="px-2 py-2 whitespace-nowrap">{row.monthKey}</td>
                  <td className="px-2 py-2">{formatUsdFromCents(row.monthCommissionCents)}</td>
                  <td className="px-2 py-2">{formatUsdFromCents(row.carriedInCents)}</td>
                  <td className="px-2 py-2">{formatUsdFromCents(row.combinedCents)}</td>
                  <td className="px-2 py-2">
                    {row.paid ? (
                      <span className="text-[#52B788]">
                        Paid {formatUsdFromCents(row.payoutAmountCents ?? 0)}
                        {row.payoutPaidAt ? ` on ${formatDateWithYear(row.payoutPaidAt)}` : ""}
                        {row.payoutMethod ? ` via ${row.payoutMethod}` : ""}
                        {row.payoutNote ? ` - ${row.payoutNote}` : ""}
                      </span>
                    ) : row.underMinimum && !row.isQuarterEnd ? (
                      <span className="text-amber-300/90">Carried forward (under $25)</span>
                    ) : row.isQuarterEnd && row.quarterEndLabel ? (
                      <span className="text-zinc-400">
                        Quarter end - carried balance due by {row.quarterEndLabel}
                      </span>
                    ) : row.amountDueCents <= 0 && row.combinedCents <= 0 ? (
                      <span className="text-zinc-400">Nothing due</span>
                    ) : (
                      <span className="text-zinc-400">Unpaid</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {row.paid
                      ? "-"
                      : row.amountDueCents > 0
                        ? formatUsdFromCents(row.amountDueCents)
                        : row.carriedForwardCents > 0
                          ? `Carried: ${formatUsdFromCents(row.carriedForwardCents)}`
                          : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payableMonthSummaries.length > 0 ? (
        <form onSubmit={(event) => void handleMarkPaid(event)} className="mt-6 space-y-3 border-t border-[#18243a] pt-4">
          <p className="text-sm font-semibold text-zinc-100">Mark month as paid</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm text-zinc-300">
              Month
              <select
                value={payoutMonthKey}
                onChange={(event) => {
                  setPayoutMonthKey(event.target.value);
                  setPayoutAmountDollars("");
                }}
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
              >
                <option value="">Select month</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-zinc-300">
              Payment date
              <input
                type="date"
                value={payoutDate}
                onChange={(event) => setPayoutDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              Method
              <select
                value={payoutMethod}
                onChange={(event) =>
                  setPayoutMethod(event.target.value as (typeof COMMISSION_PAYOUT_METHODS)[number])
                }
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
              >
                {COMMISSION_PAYOUT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-zinc-300">
              Amount (defaults to amount due)
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={
                  selectedPayoutMonth
                    ? (selectedPayoutMonth.amountDueCents / 100).toFixed(2)
                    : ""
                }
                value={payoutAmountDollars}
                onChange={(event) => setPayoutAmountDollars(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
              />
            </label>
          </div>
          <label className="block text-sm text-zinc-300">
            Reference / note
            <input
              type="text"
              value={payoutNote}
              onChange={(event) => setPayoutNote(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
            />
          </label>
          {payoutError ? <p className="text-sm text-red-300">{payoutError}</p> : null}
          <button
            type="submit"
            disabled={payoutLoading || !payoutMonthKey}
            className="rounded-lg bg-[#52B788] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {payoutLoading ? "Saving..." : `Mark ${payoutMonthKey || "month"} as paid`}
          </button>
        </form>
        ) : null}

        <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-[#18243a] pt-4">
          <label className="block text-sm text-zinc-300">
            CSV export month
            <select
              value={exportMonthKey}
              onChange={(event) => setExportMonthKey(event.target.value)}
              className="mt-1 rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
            >
              {allMonthKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <a
            href={`/api/admin/commissions/export?orgId=${encodeURIComponent(summary.org.id)}&monthKey=${encodeURIComponent(exportMonthKey)}`}
            className="rounded-lg border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
          >
            Download CSV
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Families (eligibility overrides)</h3>
        {familyError ? <p className="mt-2 text-sm text-red-300">{familyError}</p> : null}
        <div className="admin-table-wrap mt-3">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Member</th>
                <th className="px-2 py-2">Eligibility</th>
                <th className="px-2 py-2">Override</th>
              </tr>
            </thead>
            <tbody>
              {summary.families.map((family) => (
                <FamilyOverrideRow
                  key={family.userId}
                  orgName={summary.org.name}
                  family={family}
                  onSave={handleFamilyOverride}
                />
              ))}
            </tbody>
          </table>
          {summary.families.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No members linked to this org yet.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Ledger (latest 100)</h3>
        <div className="admin-table-wrap mt-3">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Member</th>
                <th className="px-2 py-2">Amount paid</th>
                <th className="px-2 py-2">Processing fee</th>
                <th className="px-2 py-2">Net</th>
                <th className="px-2 py-2">Rate</th>
                <th className="px-2 py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              {summary.ledger.map((entry) => (
                <tr key={entry.id} className="border-t border-[#18243a]">
                  <td className="px-2 py-2 whitespace-nowrap">{formatDateWithYear(entry.paidAt)}</td>
                  <td className="px-2 py-2">{entry.memberEmail}</td>
                  <td className="px-2 py-2">
                    {formatUsdFromCents(Math.abs(entry.amountPaidCents))}
                    {entry.isRefund ? " (refund)" : ""}
                  </td>
                  <td className="px-2 py-2">
                    {entry.isRefund
                      ? "-"
                      : entry.processingFeeCents == null
                        ? entry.commissionFeePending
                          ? "Pending"
                          : "-"
                        : formatUsdFromCents(entry.processingFeeCents)}
                  </td>
                  <td className="px-2 py-2">
                    {entry.netCents == null
                      ? entry.commissionFeePending
                        ? "Pending"
                        : "-"
                      : formatUsdFromCents(entry.netCents)}
                  </td>
                  <td className="px-2 py-2">{formatAdminCommissionRate(entry.commissionRate)}</td>
                  <td className="px-2 py-2">
                    {entry.commissionFeePending
                      ? "Pending fee"
                      : formatUsdFromCents(entry.commissionCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.ledger.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No ledger entries yet.</p>
          ) : null}
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        <Link href={ADMIN_ROUTES.players.organizations} className="text-[#52B788] underline">
          Edit org commission settings
        </Link>
      </p>
    </div>
  );
}

function FamilyOverrideRow(props: {
  orgName: string;
  family: AdminCommissionOrgDetail["families"][number];
  onSave: (userId: string, countForCommission: boolean, note: string) => Promise<void>;
}) {
  const [countForCommission, setCountForCommission] = useState(
    props.family.commissionEligibleAdminOverride,
  );
  const [note, setNote] = useState(props.family.commissionOverrideNote ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <tr className="border-t border-[#18243a]">
      <td className="px-2 py-2">
        <p>{props.family.playerName || props.family.email}</p>
        <p className="text-xs text-zinc-500">{props.family.email}</p>
      </td>
      <td className="px-2 py-2">{props.family.eligibilityLabel}</td>
      <td className="px-2 py-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={countForCommission}
            onChange={(event) => setCountForCommission(event.target.checked)}
          />
          Count for {props.orgName} commission
        </label>
        <input
          type="text"
          placeholder="Optional note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-2 w-full max-w-xs rounded-lg border border-[#2b3650] bg-black/40 px-2 py-1 text-xs text-zinc-100"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void props.onSave(props.family.userId, countForCommission, note).finally(() => {
              setSaving(false);
            });
          }}
          className="mt-2 rounded border border-[#52B788] px-2 py-1 text-xs text-[#52B788] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}
