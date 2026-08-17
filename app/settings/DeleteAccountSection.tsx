"use client";

import { useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsCardClass,
  settingsDangerButtonClass,
  settingsErrorMessageClass,
  settingsInputClass,
  settingsLabelClass,
  settingsMutedTextClass,
  settingsPrimaryButtonClass,
  settingsSecondaryButtonClass,
  settingsSectionTitleClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";

type DeleteAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
};

function DeleteAccountModal({ isOpen, onClose, userEmail, userName }: DeleteAccountModalProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleClose = () => {
    setConfirmEmail("");
    setErrorMessage("");
    setSuccessMessage("");
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/delete-account-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmEmail }),
    });

    setIsSubmitting(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to submit deletion request right now.");
      return;
    }

    setSuccessMessage(
      data.message ??
        "Your deletion request has been sent to Coach Broc. He will follow up with you directly.",
    );
    setConfirmEmail("");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className={`${settingsCardClass} max-w-md shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="delete-account-title" className={`${settingsSectionTitleClass} text-red-300`}>
          Delete Account
        </h3>
        <p className={`mt-3 ${settingsMutedTextClass}`}>
          This action is permanent. Your account, progress, and submission history will be removed.
          Type your email address to confirm you want to request account deletion.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className={settingsLabelClass}>Confirm email for {userName || "your account"}</span>
            <input
              type="email"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder={userEmail}
              className={settingsInputClass}
              required
            />
          </label>

          {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
          {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={settingsSecondaryButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()}
              className={settingsDangerButtonClass}
            >
              {isSubmitting ? "Sending..." : "Confirm Deletion Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteAccountSectionProps = {
  userEmail: string;
  userName: string;
};

export default function DeleteAccountSection({ userEmail, userName }: DeleteAccountSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="rounded-xl border border-red-500/30 bg-[#0b1324]/80 p-6">
        <h2 className="text-lg font-bold text-red-300">Danger Zone</h2>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-100">Delete Account</p>
            <p className="mt-1 text-sm text-zinc-400">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={settingsDangerButtonClass}
          >
            Delete Account
          </button>
        </div>
      </section>

      <DeleteAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userEmail={userEmail}
        userName={userName}
      />
    </>
  );
}
