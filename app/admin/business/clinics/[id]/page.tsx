import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminClinicDetailPanel from "@/app/admin/business/clinics/AdminClinicDetailPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClinicDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clinic detail"
        description="Edit clinic settings and manage the registration roster."
        backHref={ADMIN_ROUTES.business.clinics}
        backLabel="Clinics"
      />
      <AdminClinicDetailPanel clinicId={id} />
    </div>
  );
}
