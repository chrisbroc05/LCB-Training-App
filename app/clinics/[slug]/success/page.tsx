import Link from "next/link";
import { notFound } from "next/navigation";
import { createClinicSetPasswordToken } from "@/lib/clinics-account-server";
import {
  formatClinicDaysWithTimeList,
  formatClinicMoney,
  formatClinicTimeRange,
} from "@/lib/clinics-shared";
import { getClinicRegistrationForSuccess } from "@/lib/clinics-public-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

async function resolveSuccessCta(params: {
  userId: string | null;
  paidAt: Date | null;
  registrationCreatedAt: Date;
}) {
  if (!params.userId) {
    return {
      href: "/auth?mode=login",
      label: "Log in to the app",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, createdAt: true, membershipTier: true },
  });
  if (!user) {
    return {
      href: "/auth?mode=login",
      label: "Log in to the app",
    };
  }

  const anchor = params.paidAt ?? params.registrationCreatedAt;
  const createdNearPayment =
    Math.abs(user.createdAt.getTime() - anchor.getTime()) <= 15 * 60 * 1000;
  const unusedToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (user.membershipTier === "FREE" && (createdNearPayment || unusedToken)) {
    const token = await createClinicSetPasswordToken(user.id);
    return {
      href: token.resetUrl,
      label: "Set your password",
    };
  }

  return {
    href: "/auth?mode=login",
    label: "Log in to the app",
  };
}

export default async function ClinicSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const sessionId =
    typeof resolvedSearch.session_id === "string" ? resolvedSearch.session_id : "";

  const registration = await getClinicRegistrationForSuccess(sessionId);
  if (!registration || registration.clinic.slug !== slug) {
    notFound();
  }

  const daysListLabel = formatClinicDaysWithTimeList(
    registration.days.map((row) => row.clinicDay.date),
    registration.clinic.startTimeLocal,
    registration.clinic.endTimeLocal,
  );
  const isPaid = registration.status === "PAID";
  const cta = await resolveSuccessCta({
    userId: registration.userId,
    paidAt: registration.paidAt,
    registrationCreatedAt: registration.createdAt,
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold text-zinc-100">
          {isPaid ? "You're registered" : "Payment received"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {registration.playerName} is signed up for {registration.clinic.name}.
        </p>

        <div className="mt-8 space-y-3 rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-6 text-sm text-zinc-300">
          <p>
            <span className="font-semibold text-zinc-100">Days: </span>
            {daysListLabel}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Time: </span>
            {formatClinicTimeRange(
              registration.clinic.startTimeLocal,
              registration.clinic.endTimeLocal,
            )}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Location: </span>
            {registration.clinic.location}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">What to bring: </span>
            {registration.clinic.whatToBring}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Amount: </span>
            {formatClinicMoney(registration.amountCents)}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Refund policy: </span>
            {registration.clinic.refundPolicyText}
          </p>
          <p className="pt-2 text-zinc-400">
            Your Terms and Waiver acceptance (including emergency contact and signature) is on
            file for this clinic. No extra waiver step is needed.
          </p>
          <p className="text-zinc-400">
            Your free swing breakdown and daily challenges are waiting in the app.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            {cta.label}
          </Link>
          <Link
            href={`/clinics/${registration.clinic.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-[#2b3650] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#22c55e]/50"
          >
            Back to clinic
          </Link>
        </div>

        {!isPaid ? (
          <p className="mt-6 text-sm text-zinc-500">
            If this page still says pending, wait a few seconds and refresh. Stripe may still be
            confirming payment.
          </p>
        ) : null}
    </div>
  );
}
