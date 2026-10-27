import Link from "next/link";

type Props = {
  graceEndsLabel: string;
};

export default function MembershipPaymentPastDueBanner({ graceEndsLabel }: Props) {
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-center text-sm text-amber-50">
      Your membership payment did not go through.{" "}
      <Link href="/settings" className="font-semibold underline underline-offset-2">
        Update your card in Settings
      </Link>{" "}
      by {graceEndsLabel} to keep access.
    </div>
  );
}
