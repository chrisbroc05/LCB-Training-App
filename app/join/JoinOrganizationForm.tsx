"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildOrgJoinAuthSignInHref,
  buildOrgJoinAuthSignupHref,
  buildOrgJoinWelcomePath,
} from "@/lib/org-join-auth-shared";

type JoinTeamOption = {
  id: string;
  name: string;
};

type JoinOrganizationFormProps = {
  code: string;
  organizationName: string;
  teams: JoinTeamOption[];
  isLoggedIn: boolean;
};

export default function JoinOrganizationForm({
  code,
  organizationName,
  teams,
  isLoggedIn,
}: JoinOrganizationFormProps) {
  const router = useRouter();
  const [orgTeamId, setOrgTeamId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canJoinAsSignedIn, setCanJoinAsSignedIn] = useState(isLoggedIn);

  useEffect(() => {
    setCanJoinAsSignedIn(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      return;
    }

    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((session: { user?: { email?: string | null } }) => {
        if (cancelled || !session.user?.email) {
          return;
        }
        setCanJoinAsSignedIn(true);
        router.refresh();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, router]);

  async function handleJoin() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/org/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          orgTeamId: orgTeamId || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not join organization.");
        return;
      }
      window.location.href = buildOrgJoinWelcomePath(code);
    } catch {
      setError("Could not join organization.");
    } finally {
      setLoading(false);
    }
  }

  if (!canJoinAsSignedIn) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-zinc-300">
          Sign in or create an account to join {organizationName}.
        </p>
        <a
          href={buildOrgJoinAuthSignupHref(code)}
          className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black"
        >
          Continue to sign up
        </a>
        <p className="text-sm text-zinc-400">
          Already have an account?{" "}
          <a href={buildOrgJoinAuthSignInHref(code)} className="text-[#52B788] underline">
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {teams.length > 0 ? (
        <label className="block text-sm text-zinc-200">
          Pick your team
          <select
            value={orgTeamId}
            onChange={(event) => setOrgTeamId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-4 py-3 text-sm text-zinc-100"
          >
            <option value="">Choose a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleJoin()}
        className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {loading ? "Joining..." : `Join ${organizationName}`}
      </button>
    </div>
  );
}
