import { notFound } from "next/navigation";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminOrgClubReportView from "@/app/admin/organizations/AdminOrgClubReportView";
import { loadAdminOrgClubReport } from "@/lib/admin-org-club-report-server";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

type PageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function AdminOrgClubReportPage({ params }: PageProps) {
  const { orgId } = await params;
  const report = await loadAdminOrgClubReport(orgId);
  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Club report"
        description={`Shareable counts for ${report.orgName} (no player names on this page).`}
        backHref={ADMIN_ROUTES.players.organizations}
        backLabel="Organizations"
      />
      <AdminOrgClubReportView report={report} />
    </div>
  );
}
