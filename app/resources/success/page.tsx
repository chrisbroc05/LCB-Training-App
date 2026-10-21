"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type DownloadItem = { label: string; url: string };

function ResourcesSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setPending(false);
      setError("Missing checkout session.");
      return;
    }

    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      const response = await fetch(
        `/api/resources/success?session_id=${encodeURIComponent(sessionId)}`,
      );
      const data = (await response.json()) as {
        pending?: boolean;
        downloads?: DownloadItem[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Unable to load downloads.");
        setPending(false);
        return;
      }
      if (data.pending && attempts < 8) {
        window.setTimeout(poll, 1500);
        return;
      }
      setDownloads(data.downloads ?? []);
      setPending(false);
    };

    void poll();
  }, [sessionId]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-white">Thank you for your purchase</h1>
      {pending ? (
        <p className="mt-4 text-zinc-300">Preparing your downloads...</p>
      ) : error ? (
        <p className="mt-4 text-red-400">{error}</p>
      ) : (
        <>
          <p className="mt-4 text-zinc-300">Save these PDFs to your device. Links expire in 15 minutes.</p>
          <ul className="mt-6 space-y-3">
            {downloads.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#52B788]"
                >
                  Download {item.label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-8 text-sm text-zinc-400">
        A receipt with download links was sent to your email. Create a free account anytime to track
        purchases in{" "}
        <Link href="/profile" className="text-[#52B788] underline">
          your profile
        </Link>
        .
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        <Link href="/resources" className="text-[#52B788] underline">
          Back to resources
        </Link>
      </p>
    </div>
  );
}

export default function ResourcesSuccessPage() {
  return (
    <Suspense fallback={<p className="p-8 text-zinc-300">Loading...</p>}>
      <ResourcesSuccessContent />
    </Suspense>
  );
}
