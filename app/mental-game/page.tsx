import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MentalGameForm from "@/app/mental-game/MentalGameForm";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";

export default async function MentalGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
  if (!hasDatabaseTierAccess(membershipTier, "pro")) {
    redirect("/dashboard?upgrade=pro-required");
  }
  const vimeoUploadEnabled = process.env.VIMEO_UPLOAD_ENABLED?.toLowerCase() === "true";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Mental Game Support</h1>
        <p className="mt-2 text-zinc-300">
          Submit what you are dealing with mentally so your coach can send support and adjustments.
        </p>

        <MentalGameForm vimeoUploadEnabled={vimeoUploadEnabled} />
      </section>
    </div>
  );
}
