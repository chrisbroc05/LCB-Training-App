import { notFound } from "next/navigation";
import { clearDevOutbox, getDevOutboxSnapshot } from "@/lib/dev-outbox-server";

export default async function DevOutboxPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const snapshot = getDevOutboxSnapshot();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-100">Dev outbox</h1>
        <form action="/dev/outbox/clear" method="post">
          <button
            type="submit"
            className="rounded-full border border-[#52B788]/50 px-4 py-2 text-sm font-semibold text-[#52B788]"
          >
            Clear
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        Emails and push notifications captured in development (nothing is sent externally).
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100">Emails ({snapshot.emails.length})</h2>
        <ul className="mt-4 space-y-4">
          {snapshot.emails.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[#2b3650] p-4">
              <p className="text-xs text-zinc-500">{entry.createdAt}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{entry.subject}</p>
              <p className="text-sm text-zinc-400">To: {entry.to}</p>
              {entry.text ? (
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
                  {entry.text}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100">Push ({snapshot.pushes.length})</h2>
        <ul className="mt-4 space-y-4">
          {snapshot.pushes.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[#2b3650] p-4">
              <p className="text-xs text-zinc-500">{entry.createdAt}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{entry.title}</p>
              <p className="text-sm text-zinc-300">{entry.body}</p>
              <p className="text-xs text-zinc-500">User: {entry.userId}</p>
              {entry.url ? <p className="text-xs text-[#52B788]">{entry.url}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
