"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MediaConsentChoiceFields from "@/components/MediaConsentChoiceFields";
import {
  computeClinicAmountCents,
  formatClinicMoney,
  formatClinicSportLabel,
  formatClinicTimeRange,
  type ClinicDayAvailability,
  type ClinicSportKey,
} from "@/lib/clinics-shared";
import { LEGAL_MAX_PLAYER_AGE, LEGAL_MIN_PLAYER_AGE, LEGAL_PAGE_PATHS } from "@/lib/legal-shared";

type ClinicSignupFormProps = {
  slug: string;
  clinicName: string;
  closed: boolean;
  soldOut: boolean;
  days: ClinicDayAvailability[];
  pricePerDayCents: number;
  allDaysPriceCents: number;
  refundPolicyText: string;
  startTimeLocal: string;
  endTimeLocal: string;
  checkoutCancelled?: boolean;
};

const inputClass =
  "mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]";
const labelClass = "text-sm text-zinc-300";

export default function ClinicSignupForm({
  slug,
  clinicName,
  closed,
  soldOut,
  days,
  pricePerDayCents,
  allDaysPriceCents,
  refundPolicyText,
  startTimeLocal,
  endTimeLocal,
  checkoutCancelled = false,
}: ClinicSignupFormProps) {
  const openDays = days.filter((day) => !day.soldOut);
  const timeRangeLabel = formatClinicTimeRange(startTimeLocal, endTimeLocal);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [sport, setSport] = useState<ClinicSportKey>("BASEBALL");
  const [position, setPosition] = useState("");
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [isAllDaysBundle, setIsAllDaysBundle] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [typedSignature, setTypedSignature] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mediaConsent, setMediaConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allDaysSelected =
    days.length > 1 && selectedDayIds.length === days.length && openDays.length === days.length;

  const amountCents = useMemo(
    () =>
      computeClinicAmountCents({
        selectedDayCount: selectedDayIds.length,
        totalDayCount: days.length,
        pricePerDayCents,
        allDaysPriceCents,
        isAllDaysBundle: allDaysSelected || isAllDaysBundle,
      }),
    [
      selectedDayIds.length,
      days.length,
      pricePerDayCents,
      allDaysPriceCents,
      allDaysSelected,
      isAllDaysBundle,
    ],
  );

  if (closed || soldOut) {
    return (
      <div className="rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-6">
        <p className="text-lg font-semibold text-zinc-100">Sold out</p>
        <p className="mt-2 text-sm text-zinc-400">
          {clinicName} is not accepting new signups right now.
        </p>
      </div>
    );
  }

  const toggleDay = (dayId: string, soldOutDay: boolean) => {
    if (soldOutDay) {
      return;
    }
    setSelectedDayIds((current) => {
      const next = current.includes(dayId)
        ? current.filter((id) => id !== dayId)
        : [...current, dayId];
      const everyOpenDaySelected =
        days.length > 1 &&
        openDays.length === days.length &&
        next.length === days.length &&
        days.every((day) => next.includes(day.dayId));
      setIsAllDaysBundle(everyOpenDaySelected);
      return next;
    });
  };

  const selectAllDays = (checked: boolean) => {
    setIsAllDaysBundle(checked);
    if (checked) {
      setSelectedDayIds(openDays.map((day) => day.dayId));
    } else {
      setSelectedDayIds([]);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/clinics/${encodeURIComponent(slug)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName,
          parentEmail,
          parentPhone,
          playerName,
          playerAge: Number(playerAge),
          sport,
          position,
          dayIds: selectedDayIds,
          isAllDaysBundle: allDaysSelected || isAllDaysBundle,
          termsAccepted,
          mediaConsent,
          marketingOptIn,
          emergencyContactName,
          emergencyContactPhone,
          typedSignature,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        checkoutUrl?: string;
        soldOutDays?: string[];
      };
      if (!response.ok || !payload.checkoutUrl) {
        setError(
          payload.error ||
            (payload.soldOutDays?.length
              ? `Sold out: ${payload.soldOutDays.join(", ")}`
              : "Could not start checkout."),
        );
        setLoading(false);
        return;
      }
      window.location.href = payload.checkoutUrl;
    } catch {
      setError("Could not start checkout.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-6">
      <h2 className="text-xl font-semibold text-zinc-100">Register</h2>
      <p className="text-sm text-zinc-400">
        One player per checkout. Register siblings in a separate signup.
      </p>

      {checkoutCancelled ? (
        <p className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          Checkout was cancelled. Your spot hold was released. You can try again below.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Parent / guardian full name</span>
          <input
            className={inputClass}
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Parent email</span>
          <input
            type="email"
            className={inputClass}
            value={parentEmail}
            onChange={(event) => setParentEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className={labelClass}>Parent phone (optional)</span>
          <input
            type="tel"
            className={inputClass}
            value={parentPhone}
            onChange={(event) => setParentPhone(event.target.value)}
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Player full name</span>
          <input
            className={inputClass}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Player age</span>
          <input
            type="number"
            min={LEGAL_MIN_PLAYER_AGE}
            max={LEGAL_MAX_PLAYER_AGE}
            className={inputClass}
            value={playerAge}
            onChange={(event) => setPlayerAge(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sport</span>
          <select
            className={inputClass}
            value={sport}
            onChange={(event) => setSport(event.target.value as ClinicSportKey)}
          >
            <option value="BASEBALL">{formatClinicSportLabel("BASEBALL")}</option>
            <option value="SOFTBALL">{formatClinicSportLabel("SOFTBALL")}</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Position (optional)</span>
          <input
            className={inputClass}
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="SS, 2B, etc."
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Clinic days</legend>
        {days.map((day) => (
          <label
            key={day.dayId}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm ${
              day.soldOut
                ? "border-[#2b3650] text-zinc-500"
                : "border-[#2b3650] text-zinc-200"
            }`}
          >
            <span className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selectedDayIds.includes(day.dayId)}
                disabled={day.soldOut}
                onChange={() => toggleDay(day.dayId, day.soldOut)}
              />
              <span className="min-w-0">
                <span className="block">{day.dateLabel}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">({timeRangeLabel})</span>
              </span>
            </span>
            <span className="text-xs text-zinc-400">
              {day.soldOut ? "Sold out" : `${day.spotsLeft} left`}
            </span>
          </label>
        ))}
        {days.length > 1 ? (
          <label className="flex items-center gap-3 pt-1 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={allDaysSelected || isAllDaysBundle}
              disabled={openDays.length !== days.length}
              onChange={(event) => selectAllDays(event.target.checked)}
            />
            All {days.length} days ({formatClinicMoney(allDaysPriceCents)})
          </label>
        ) : null}
      </fieldset>

      <p className="text-base font-semibold text-[#9df3bd]">
        Total: {formatClinicMoney(amountCents)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Emergency contact name</span>
          <input
            className={inputClass}
            value={emergencyContactName}
            onChange={(event) => setEmergencyContactName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Emergency contact phone</span>
          <input
            type="tel"
            className={inputClass}
            value={emergencyContactPhone}
            onChange={(event) => setEmergencyContactPhone(event.target.value)}
            required
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Type your full name as signature</span>
        <input
          className={inputClass}
          value={typedSignature}
          onChange={(event) => setTypedSignature(event.target.value)}
          placeholder="Must match parent / guardian full name"
          required
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          required
        />
        <span>
          I am the parent or guardian and agree to the{" "}
          <Link href={LEGAL_PAGE_PATHS.terms} className="text-[#52B788] underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href={LEGAL_PAGE_PATHS.waiver} className="text-[#52B788] underline">
            Waiver
          </Link>
          . My typed name is my signature for this clinic.
        </span>
      </label>

      <MediaConsentChoiceFields
        mediaConsent={mediaConsent}
        onChange={setMediaConsent}
        namePrefix="clinicMediaConsent"
      />

      <label className="flex items-start gap-3 text-sm text-zinc-400">
        <input
          type="checkbox"
          className="mt-1"
          checked={marketingOptIn}
          onChange={(event) => setMarketingOptIn(event.target.checked)}
        />
        <span>Email me occasional LCB Training updates (optional).</span>
      </label>

      <div className="rounded-lg border border-[#2b3650] px-3 py-3 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300">Refund policy</p>
        <p className="mt-1">{refundPolicyText}</p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || selectedDayIds.length === 0 || amountCents <= 0}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Starting checkout..." : `Pay ${formatClinicMoney(amountCents)}`}
      </button>
    </form>
  );
}
