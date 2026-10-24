import { notFound } from "next/navigation";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminResourceClickList from "@/app/admin/content/resources/AdminResourceClickList";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminContentResourceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const definition = getResourceDefinition(slug);
  if (!definition) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={definition.title}
        description={`People who clicked this resource card (${definition.tag}).`}
        backHref={ADMIN_ROUTES.content.resources}
        backLabel="Resources stats"
      />
      <section className="admin-page-section">
        <AdminResourceClickList slug={slug} title={definition.title} />
      </section>
    </div>
  );
}
