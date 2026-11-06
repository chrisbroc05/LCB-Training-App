"use client";

import { useState } from "react";
import { LEAD_ROLE_OPTIONS, getResourceDefinition, type LeadRoleValue } from "@/lib/resources-shared";
import { PLAYER_IQ_QUIZ_RESOURCE_SLUG } from "@/lib/player-iq-quiz-shared";

type QuizLeadCaptureFormProps = {
  onSubmit: (fields: {
    firstName: string;
    email: string;
    role: LeadRoleValue;
    playerAge13Plus?: boolean | null;
    parentEmail?: string | null;
  }) => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
};

/**
 * Same fields and consent copy as resources lead capture (ResourceLeadModal), inlined for post-quiz flow.
 */
export default function QuizLeadCaptureForm({
  onSubmit,
  onBack,
  submitting,
  error,
}: QuizLeadCaptureFormProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [role, setRole] = useState<LeadRoleValue>("PLAYER");
  const [playerAge13Plus, setPlayerAge13Plus] = useState<boolean | null>(null);
  const playerUnder13 = role === "PLAYER" && playerAge13Plus === false;
  const resource = getResourceDefinition(PLAYER_IQ_QUIZ_RESOURCE_SLUG);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#52B788]">
          {resource?.title ?? "Player IQ Quiz"}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Quick details before your results</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Player first name, role (player, parent, or coach), and email - same as our free
          resources.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            firstName,
            email: playerUnder13 ? "" : email,
            role,
            playerAge13Plus: role === "PLAYER" ? playerAge13Plus : undefined,
            parentEmail: playerUnder13 ? parentEmail : undefined,
          });
        }}
      >
        <label className="block text-sm text-zinc-300">
          Player first name
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3.5 text-base text-white"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm text-zinc-300">Are you the player or the parent?</legend>
          <select
            aria-label="Are you the player or the parent?"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as LeadRoleValue);
              setPlayerAge13Plus(null);
            }}
            className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3.5 text-base text-white"
          >
            {LEAD_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </fieldset>
        {role === "PLAYER" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm text-zinc-300">Are you 13 or older?</legend>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="playerAge13Plus"
                  checked={playerAge13Plus === true}
                  onChange={() => setPlayerAge13Plus(true)}
                  required={playerAge13Plus === null}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="playerAge13Plus"
                  checked={playerAge13Plus === false}
                  onChange={() => setPlayerAge13Plus(false)}
                />
                No
              </label>
            </div>
          </fieldset>
        ) : null}
        {playerUnder13 ? (
          <label className="block text-sm text-zinc-300">
            Parent or guardian email
            <input
              required
              type="email"
              autoComplete="email"
              value={parentEmail}
              onChange={(event) => setParentEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3.5 text-base text-white"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              We email your parent, not you. Do not enter a child email here.
            </span>
          </label>
        ) : (
          <label className="block text-sm text-zinc-300">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3.5 text-base text-white"
            />
          </label>
        )}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[52px] rounded-full border border-[#2b3650] px-6 py-3 text-base font-semibold text-zinc-200 hover:border-[#52B788]/50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[52px] rounded-full bg-[#2D6A4F] px-6 py-3 text-base font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "See my results"}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          By continuing, you agree to get training tips and offers from Coach Broc by email.
          Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
