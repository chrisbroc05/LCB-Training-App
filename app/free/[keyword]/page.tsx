import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import FreeResourceLandingClient from "@/app/free/FreeResourceLandingClient";
import { authOptions } from "@/lib/auth";
import { getInstagramFreeLink } from "@/lib/instagram-free-links-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type FreeKeywordPageProps = {
  params: Promise<{ keyword: string }>;
};

export async function generateMetadata({ params }: FreeKeywordPageProps) {
  const { keyword } = await params;
  const link = getInstagramFreeLink(keyword);
  if (!link) {
    return { title: "Free resource | LCB Training" };
  }
  const resource = getResourceDefinition(link.resourceSlug);
  return {
    title: resource ? `${resource.title} | LCB Training` : "Free resource | LCB Training",
    description: resource?.description,
  };
}

export default async function FreeKeywordPage({ params }: FreeKeywordPageProps) {
  const { keyword } = await params;
  const link = getInstagramFreeLink(keyword);
  if (!link) {
    notFound();
  }

  const resource = getResourceDefinition(link.resourceSlug);
  if (!resource || resource.type !== "FREE_DOWNLOAD") {
    notFound();
  }

  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#52B788]">Free PDF</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
        {resource.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-300">{resource.description}</p>
      <FreeResourceLandingClient
        resource={resource}
        leadSource={link.leadSource}
        isLoggedIn={Boolean(session?.user?.id)}
      />
    </div>
  );
}
