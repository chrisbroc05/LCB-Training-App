"use client";

import { useEffect, useRef, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsCardClass,
  settingsErrorMessageClass,
  settingsInputClass,
  settingsLabelClass,
  settingsMutedTextClass,
  settingsPrimaryButtonClass,
  settingsSectionTitleClass,
  settingsSecondaryButtonClass,
  settingsSuccessMessageClass,
  settingsTextareaClass,
} from "@/app/settings/settings-styles";

function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const modalRef = useRef<HTMLDivElement | null>(null);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleClose();
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    setIsSaving(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to update your password right now.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("Password updated successfully");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className={`${settingsCardClass} shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="change-password-title" className={settingsSectionTitleClass}>
          Change Password
        </h3>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className={settingsLabelClass}>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={settingsInputClass}
            />
          </label>

          <label className="block">
            <span className={settingsLabelClass}>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={settingsInputClass}
            />
          </label>

          <label className="block">
            <span className={settingsLabelClass}>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={settingsInputClass}
            />
          </label>

          {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
          {successMessage ? (
            <p className={settingsSuccessMessageClass}>{successMessage}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className={settingsSecondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={settingsPrimaryButtonClass}>
              {isSaving ? "Saving..." : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SettingsCard
        title="Change Password"
        description="Update your password to keep your account secure."
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={settingsSecondaryButtonClass}
        >
          Change Password
        </button>
      </SettingsCard>

      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
