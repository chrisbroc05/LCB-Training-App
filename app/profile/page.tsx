import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DatabaseTier } from "@/lib/membership";
import { stripe } from "@/lib/stripe";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SubmissionStatus = "PENDING" | "REVIEWING" | "COMPLETED";
type SubmissionType = "SWING" | "MENTAL";

type ProfileSubmission = {
  id: string;
  type: SubmissionType;
  createdAt: Date;
  status: SubmissionStatus;
  playerName: string;
  originalMessage: string;
  originalVideoUrl: string | null;
  responseText: string | null;
  responseVideoUrl: string | null;
  extraLines: string[];
};

function formatTierLabel(tier: DatabaseTier) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toVimeoEmbedUrl(url: string | null) {
  if (!url) {
    return null;
  }

  if (url.includes("player.vimeo.com/video/")) {
    return url;
  }

  const match = url.match(/vimeo\.com\/(\d+)/i);
  if (!match) {
    return null;
  }

  return `https://player.vimeo.com/video/${match[1]}`;
}

async function getStripeBillingDate(params: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}) {
  if (!params.stripeSubscriptionId) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId);

    if (
      params.stripeCustomerId &&
      typeof subscription.customer === "string" &&
      subscription.customer !== params.stripeCustomerId
    ) {
      return null;
    }

    const subscriptionWithPeriod = subscription as unknown as { current_period_end?: number };
    if (typeof subscriptionWithPeriod.current_period_end === "number") {
      return new Date(subscriptionWithPeriod.current_period_end * 1000);
    }

    const itemPeriodEnds = subscription.items.data
      .map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === "number");

    if (!itemPeriodEnds.length) {
      return null;
    }

    return new Date(Math.max(...itemPeriodEnds) * 1000);
  } catch {
    return null;
  }
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedTypeParam =
    typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type.toUpperCase() : "";
  const selectedIdParam = typeof resolvedSearchParams.id === "string" ? resolvedSearchParams.id : "";

  const [user, swingSubmissions, mentalSubmissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        membershipTier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionCurrentPeriodEnd: true,
      },
    }),
    prisma.swingAnalysisSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) {
    redirect("/auth");
  }

  const merged: ProfileSubmission[] = [
    ...swingSubmissions.map((item) => ({
      id: item.id,
      type: "SWING" as const,
      createdAt: item.createdAt,
      status: item.status,
      playerName: item.playerName,
      originalMessage: item.notes,
      originalVideoUrl: item.submittedVideo,
      responseText: item.responseText,
      responseVideoUrl: item.responseVideoUrl,
      extraLines: [`Pitch Focus: ${item.pitchType}`, `Handedness: ${item.handedness}`],
    })),
    ...mentalSubmissions.map((item) => ({
      id: item.id,
      type: "MENTAL" as const,
      createdAt: item.createdAt,
      status: item.status,
      playerName: item.playerName,
      originalMessage: item.message,
      originalVideoUrl: item.videoPath,
      responseText: item.responseText,
      responseVideoUrl: item.responseVideoUrl,
      extraLines: [`Topic: ${item.topic}`, `Age: ${item.playerAge}`],
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const selectedSubmission =
    merged.find(
      (item) =>
        item.id === selectedIdParam && item.type === (selectedTypeParam === "MENTAL" ? "MENTAL" : "SWING"),
    ) ?? merged[0];

  const nextBillingDate =
    (await getStripeBillingDate({
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeCustomerId: user.stripeCustomerId,
    })) ?? user.subscriptionCurrentPeriodEnd;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">My Profile</h1>
        <p className="mt-2 text-zinc-300">
          Review your account details and track your coaching submissions in one place.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Account Info</h2>
          <p className="mt-3 text-sm text-zinc-300">Name: {user.name ?? "Not provided"}</p>
          <p className="mt-1 text-sm text-zinc-300">Email: {user.email}</p>
          <div className="mt-4 inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
            {formatTierLabel(user.membershipTier)}
          </div>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Membership Details</h2>
          <p className="mt-3 text-sm text-zinc-300">Next billing date: {formatDate(nextBillingDate)}</p>
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            Manage Membership in Settings
          </Link>
        </article>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">My Submissions</h2>
          {merged.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">You have not submitted any requests yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {merged.map((submission) => {
                const statusLabel =
                  submission.status === "COMPLETED" ? "Responded" : "Pending Review";
                return (
                  <Link
                    key={`${submission.type}-${submission.id}`}
                    href={`/profile?type=${submission.type.toLowerCase()}&id=${submission.id}`}
                    className={`block rounded-xl border p-4 transition ${
                      selectedSubmission?.id === submission.id
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                        : "border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100">
                        {submission.type === "SWING" ? "Swing Analysis" : "Mental Game Support"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          submission.status === "COMPLETED"
                            ? "bg-[#22c55e]/20 text-[#9df3bd]"
                            : "bg-[#24314a] text-zinc-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{formatDateTime(submission.createdAt)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Submission Details</h2>
          {!selectedSubmission ? (
            <p className="mt-4 text-sm text-zinc-400">Select a submission to view details.</p>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                <p className="text-sm font-semibold text-zinc-100">Original Submission</p>
                <p className="mt-2 text-sm text-zinc-300">Player: {selectedSubmission.playerName}</p>
                {selectedSubmission.extraLines.map((line) => (
                  <p key={line} className="mt-1 text-sm text-zinc-300">
                    {line}
                  </p>
                ))}
                <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                  {selectedSubmission.originalMessage}
                </p>
                {selectedSubmission.originalVideoUrl && (
                  <div className="mt-4 space-y-2">
                    <a
                      href={selectedSubmission.originalVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#8fd7ff] underline"
                    >
                      View Original Video
                    </a>
                    {toVimeoEmbedUrl(selectedSubmission.originalVideoUrl) && (
                      <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
                        <iframe
                          src={toVimeoEmbedUrl(selectedSubmission.originalVideoUrl) ?? undefined}
                          title="Original submission video"
                          className="absolute inset-0 h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                <p className="text-sm font-semibold text-zinc-100">Coach Chris Response</p>
                {selectedSubmission.status === "COMPLETED" ? (
                  <div className="mt-3 space-y-3">
                    {selectedSubmission.responseText && (
                      <p className="whitespace-pre-wrap text-sm text-zinc-300">
                        {selectedSubmission.responseText}
                      </p>
                    )}
                    {selectedSubmission.responseVideoUrl && (
                      <>
                        <a
                          href={selectedSubmission.responseVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#8fd7ff] underline"
                        >
                          View Coach Video Response
                        </a>
                        {toVimeoEmbedUrl(selectedSubmission.responseVideoUrl) && (
                          <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
                            <iframe
                              src={toVimeoEmbedUrl(selectedSubmission.responseVideoUrl) ?? undefined}
                              title="Coach response video"
                              className="absolute inset-0 h-full w-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </>
                    )}
                    {!selectedSubmission.responseText && !selectedSubmission.responseVideoUrl && (
                      <p className="text-sm text-zinc-400">A response was marked complete with no message attached.</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-300">
                    Coach Chris typically responds within 48 hours.
                  </p>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
