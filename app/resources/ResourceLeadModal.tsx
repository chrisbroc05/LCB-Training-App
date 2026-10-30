"use client";

import { useState } from "react";
import {
  getResourceLeadSubmitLabel,
  type ResourceLeadActionResult,
} from "@/lib/resources-lead-shared";
import DigitalProductSalesFinalNotice from "@/app/resources/DigitalProductSalesFinalNotice";
import { LEAD_ROLE_OPTIONS, type LeadRoleValue, type ResourceDefinition } from "@/lib/resources-shared";
import { followResourceLeadAction, postResourceLeadAction } from "@/lib/resources-lead-client";

type ResourceLeadModalProps = {
  resource: ResourceDefinition;
  onClose: () => void;
  onSuccess?: (result: ResourceLeadActionResult) => void;
};

export default function ResourceLeadModal({
  resource,
  onClose,
  onSuccess,
}: ResourceLeadModalProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [role, setRole] = useState<LeadRoleValue>("PLAYER");
  const [playerAge13Plus, setPlayerAge13Plus] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitLabel = getResourceLeadSubmitLabel(resource);
  const playerUnder13 = role === "PLAYER" && playerAge13Plus === false;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await postResourceLeadAction({
        resourceSlug: resource.slug,
        firstName,
        email: playerUnder13 ? "" : email,
        role,
        playerAge13Plus: role === "PLAYER" ? playerAge13Plus : undefined,
        parentEmail: playerUnder13 ? parentEmail : undefined,
      });
      if (onSuccess) {
        onSuccess(result as ResourceLeadActionResult);
      } else {
        followResourceLeadAction(result as ResourceLeadActionResult);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

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

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-zinc-300">
            First name
            <input
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3.5 text-base text-white"
            />
          </label>
          <label className="block text-sm text-zinc-300">
            I am a:
            <select
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
          </label>
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
          <button
            type="submit"
            disabled={loading}
            className="min-h-[52px] w-full rounded-full bg-[#2D6A4F] py-3.5 text-base font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
          >
            {loading ? "One moment..." : submitLabel}
          </button>
          {resource.type === "PAID_DOWNLOAD" ? (
            <DigitalProductSalesFinalNotice className="text-center text-xs leading-relaxed text-zinc-500" />
          ) : null}
          <p className="text-xs leading-relaxed text-zinc-500">
            By continuing, you agree to get training tips and offers from Coach Broc by email.
            Unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
