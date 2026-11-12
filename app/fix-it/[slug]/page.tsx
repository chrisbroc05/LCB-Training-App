import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FixItPlanAccessRecoveryClient from "@/app/fix-it/FixItPlanAccessRecoveryClient";
import FixItPlanPageClient from "@/app/fix-it/FixItPlanPageClient";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { assertFixItPlanAccessFromRequest } from "@/lib/fix-it-plan-access-server";
import { getFixItPlanByResourceSlug, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";

type FixItPlanPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

function fixItPlanShortName(title: string) {
  const beforeColon = title.split(":")[0]?.trim();
  return beforeColon || title;
}

export async function generateMetadata({ params }: FixItPlanPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isFixItResourceSlug(slug)) {
    return {
      title: { absolute: "Fix-It Plan | LCB Training" },
      description: "3-week hitting Fix-It plan with Coach Broc drills.",
    };
  }
  const plan = getFixItPlanByResourceSlug(slug);
  const planName = plan ? fixItPlanShortName(plan.title) : "Fix-It";
  const description =
    planName === "Stay Closed"
      ? "3-week plan to keep your front shoulder closed."
      : planName === "Hit the Brakes"
        ? "3-week plan to stop drifting and stay stacked."
        : "3-week hitting Fix-It plan with Coach Broc drills.";

  return {
    title: {
      absolute: `${planName} Fix-It Plan | LCB Training`,
    },
    description,
  };
}

export default async function FixItPlanPage({ params, searchParams }: FixItPlanPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!isFixItResourceSlug(slug)) {
    redirect("/fix-it");
  }

  const plan = getFixItPlanByResourceSlug(slug);
  if (!plan) {
    redirect("/fix-it");
  }

  const accessEmail = await assertFixItPlanAccessFromRequest({
    resourceSlug: slug,
    token: token ?? null,
  });

  if (!accessEmail) {
    return <FixItPlanAccessRecoveryClient plan={plan} />;
  }

  const accessToken =
    token?.trim() ||
    createFixItPlanAccessToken({ email: accessEmail, resourceSlug: slug });

  return <FixItPlanPageClient plan={plan} accessToken={accessToken} />;
}
