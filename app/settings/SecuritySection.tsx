"use client";

import { useEffect, useState } from "react";
import ResponsiveOverlay from "@/app/components/mobile/ResponsiveOverlay";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsCardClass,
  settingsErrorMessageClass,
  settingsInputClass,
  settingsLabelClass,
  settingsPrimaryButtonClass,
  settingsSecondaryButtonClass,
  settingsSuccessMessageClass,
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    <ResponsiveOverlay
      open={isOpen}
      onClose={handleClose}
      title="Change Password"
      ariaLabel="Change password"
      desktopPanelClassName={`${settingsCardClass} w-full max-w-lg shadow-2xl`}
      footer={
        <div className="flex flex-col gap-3">
          <button type="submit" form="change-password-form" disabled={isSaving} className={`${settingsPrimaryButtonClass} h-12 w-full`}>
            {isSaving ? "Saving..." : "Save New Password"}
          </button>
          <button type="button" onClick={handleClose} className={`${settingsSecondaryButtonClass} h-12 w-full`}>
            Cancel
          </button>
        </div>
      }
    >
      <form id="change-password-form" className="space-y-4" onSubmit={handleSubmit}>
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
        {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}

        <div className="hidden flex-col-reverse gap-3 pt-2 sm:flex sm:flex-row sm:justify-end">
          <button type="button" onClick={handleClose} className={settingsSecondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className={settingsPrimaryButtonClass}>
            {isSaving ? "Saving..." : "Save New Password"}
          </button>
        </div>
      </form>
    </ResponsiveOverlay>
  );
}

export default function SecuritySection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SettingsCard title="Security">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-100">Password</p>
            <p className="mt-1 font-mono text-sm tracking-widest text-zinc-400">........</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={settingsSecondaryButtonClass}
          >
            Change Password
          </button>
        </div>
      </SettingsCard>

      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
