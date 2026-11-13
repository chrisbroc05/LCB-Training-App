import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FixItPlanAccessRecoveryClient from "@/app/fix-it/FixItPlanAccessRecoveryClient";
import FixItPlanPageClient from "@/app/fix-it/FixItPlanPageClient";
import { createFixItPlanAccessToken } from "@/lib/fix-it-plan-access-token";
import { assertFixItPlanAccessFromRequest } from "@/lib/fix-it-plan-access-server";
import { getFixItPlanByResourceSlug, isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import { metadataForPublicPage } from "@/lib/public-seo";

type FixItPlanPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: FixItPlanPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "fixit-stay-closed") {
    return metadataForPublicPage("stayClosed");
  }
  if (slug === "fixit-hit-the-brakes") {
    return metadataForPublicPage("hitTheBrakes");
  }
  return metadataForPublicPage("fixIt");
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
