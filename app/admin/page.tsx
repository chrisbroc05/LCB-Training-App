import { redirect } from "next/navigation";
import AdminTodayPanel from "@/app/admin/AdminTodayPanel";
import { ADMIN_ROUTES, buildAdminCoachingReviewsUrl } from "@/lib/admin-routes-shared";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const tab = firstParam(params.tab);
  const submissionId = firstParam(params.submissionId);
  const legacySubmission = firstParam(params.submission);
  const legacyId = firstParam(params.id);

  if (tab === "swing" || tab === "mental") {
    const id = submissionId || legacyId;
    if (id) {
      redirect(buildAdminCoachingReviewsUrl(tab, id));
    }
    redirect(`${ADMIN_ROUTES.coaching.reviews}?tab=${tab}`);
  }

  if (legacySubmission === "swing" || legacySubmission === "mental") {
    if (legacyId) {
      redirect(buildAdminCoachingReviewsUrl(legacySubmission, legacyId));
    }
    redirect(`${ADMIN_ROUTES.coaching.reviews}?tab=${legacySubmission}`);
  }

  if (tab === "goal") {
    redirect(ADMIN_ROUTES.coaching.goalCheckins);
  }
  if (tab === "members") {
    redirect(ADMIN_ROUTES.players.members);
  }
  if (tab === "playbook") {
    redirect(ADMIN_ROUTES.coaching.playbookReflections);
  }

  return <AdminTodayPanel />;
}
