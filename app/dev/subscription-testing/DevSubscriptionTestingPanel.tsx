"use client";

import { useCallback, useState } from "react";

type SubscriptionSnapshot = {
  level: string;
  status: string;
  pastDueGraceEndsAt: string | null;
  accessEndedAt: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeStatus: string | null;
};

type PlayerResult = {
  userId: string;
  email: string;
  displayName: string;
  subscription: SubscriptionSnapshot | null;
};

export default function DevSubscriptionTestingPanel() {
  const [emailQuery, setEmailQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState<PlayerResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshPlayer = useCallback(async (userId: string): Promise<PlayerResult | null> => {
    const response = await fetch(
      `/api/dev/subscription-testing?userId=${encodeURIComponent(userId)}`,
    );
    const data = (await response.json().catch(() => ({}))) as PlayerResult & { error?: string };
    if (!response.ok) {
      return null;
    }
    return {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      subscription: data.subscription ?? null,
    };
  }, []);

  const search = async () => {
    const query = emailQuery.trim();
    if (query.length < 2) {
      setSearchError("Enter at least 2 characters of an email.");
      setResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    const response = await fetch(
      `/api/dev/subscription-testing?email=${encodeURIComponent(query)}`,
    );
    const data = (await response.json().catch(() => ({}))) as {
      results?: PlayerResult[];
      error?: string;
    };
    setSearchLoading(false);

    if (!response.ok) {
      setSearchError(data.error ?? "Search failed.");
      setResults([]);
      return;
    }

    const list = data.results ?? [];
    setResults(list);
    if (list.length === 0) {
      setSearchError("No players with a membership subscription match that email.");
      setSelected(null);
      return;
    }
    if (list.length === 1) {
      const one = list[0];
      if (one) {
        const fresh = await refreshPlayer(one.userId);
        setSelected(fresh ?? one);
      }
    }
  };

  const selectPlayer = async (player: PlayerResult) => {
    setMessage("");
    const fresh = await refreshPlayer(player.userId);
    setSelected(fresh ?? player);
  };

  const run = async (action: "simulate_payment_failed" | "expire_grace") => {
    if (!selected?.userId) {
      setMessage("Select a player first.");
      return;
    }

    setBusy(true);
    setMessage("");
    const response = await fetch("/api/dev/subscription-testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: selected.userId }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      subscription?: SubscriptionSnapshot | null;
    };
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Request failed.");
      return;
    }

    const fresh = await refreshPlayer(selected.userId);
    if (fresh) {
      setSelected(fresh);
      setResults((current) =>
        current.map((row) => (row.userId === fresh.userId ? fresh : row)),
      );
    }

    if (action === "simulate_payment_failed") {
      const sub = data.subscription ?? fresh?.subscription;
      setMessage(
        sub
          ? `Simulated failed renewal: app status ${sub.status}, grace until ${sub.pastDueGraceEndsAt ?? "n/a"}, Stripe ${sub.stripeStatus ?? "unknown"}.`
          : "Simulated failed renewal.",
      );
    } else {
      setMessage(
        fresh?.subscription
          ? `Grace expired. Row kept: status ${fresh.subscription.status}, access ended ${fresh.subscription.accessEndedAt ?? "n/a"}.`
          : "Grace expired but could not reload MembershipSubscription row.",
      );
    }
  };

  const subscription = selected?.subscription;

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">Player</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Search by email (players with MembershipSubscription only).
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={emailQuery}
            onChange={(event) => setEmailQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void search();
              }
            }}
            placeholder="e.g. core2@dev.lcbtraining.test"
            className="min-h-[44px] flex-1 rounded-lg border border-[#2b3650] bg-black px-4 text-zinc-100 placeholder:text-zinc-500 focus:border-[#52B788]"
          />
          <button
            type="button"
            disabled={searchLoading}
            onClick={() => void search()}
            className="min-h-[44px] rounded-full bg-[#2D6A4F] px-5 text-sm font-semibold text-white hover:bg-[#52B788] hover:text-[#0A1628] disabled:opacity-50"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
        {searchError ? <p className="mt-3 text-sm text-amber-200">{searchError}</p> : null}
        {results.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {results.map((player) => {
              const isSelected = selected?.userId === player.userId;
              return (
                <li key={player.userId}>
                  <button
                    type="button"
                    onClick={() => void selectPlayer(player)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#52B788] bg-[#52B788]/10"
                        : "border-[#2b3650] bg-black/30 hover:border-[#52B788]/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-100">{player.displayName}</p>
                    <p className="text-xs text-zinc-400">{player.email}</p>
                    {player.subscription ? (
                      <p className="mt-1 text-xs text-[#52B788]">
                        {player.subscription.level} - {player.subscription.status}
                        {player.subscription.pastDueGraceEndsAt
                          ? ` - grace ${player.subscription.pastDueGraceEndsAt}`
                          : ""}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {selected && subscription ? (
        <div className="space-y-6 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
          <div className="text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">{selected.displayName}</p>
            <p className="text-xs text-zinc-400">{selected.email}</p>
            <p className="mt-2 font-mono text-xs text-zinc-500">userId: {selected.userId}</p>
            <div className="mt-4 rounded-lg border border-[#2b3650] bg-black/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#52B788]">
                MembershipSubscription (banner + expire_grace use this)
              </p>
              <p className="mt-2">
                Level: <span className="text-zinc-100">{subscription.level}</span>
              </p>
              <p className="mt-1">
                App status: <span className="text-zinc-100">{subscription.status}</span>
              </p>
              <p className="mt-1">
                Grace ends (UTC ISO):{" "}
                <span className="text-zinc-100">
                  {subscription.pastDueGraceEndsAt ?? "none"}
                </span>
              </p>
              <p className="mt-1">
                Access ended (UTC ISO):{" "}
                <span className="text-zinc-100">{subscription.accessEndedAt ?? "none"}</span>
              </p>
              <p className="mt-1">
                Stripe subscription status:{" "}
                <span className="text-zinc-100">{subscription.stripeStatus ?? "unavailable"}</span>
              </p>
            </div>
            <p className="mt-2 font-mono text-xs text-zinc-500">
              {subscription.stripeCustomerId} / {subscription.stripeSubscriptionId}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || subscription.status !== "PAST_DUE"}
              onClick={() => void run("simulate_payment_failed")}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              Simulate failed renewal (Stripe invoice + sync)
            </button>
            <button
              type="button"
              disabled={busy || subscription.status !== "PAST_DUE"}
              onClick={() => void run("expire_grace")}
              className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-50"
            >
              Expire grace now (drop access)
            </button>
            <button
              type="button"
              disabled={busy || searchLoading}
              onClick={() => void selectPlayer(selected)}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300 disabled:opacity-50"
            >
              Refresh status
            </button>
          </div>
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
      ) : selected ? (
        <p className="text-sm text-amber-200">Selected user has no membership subscription row.</p>
      ) : (
        <p className="text-sm text-zinc-500">Search and select a player to run dev actions.</p>
      )}
    </div>
  );
}
