import type { Metadata } from "next";
import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-docs";
import { metadataForPublicPage } from "@/lib/public-seo";

export const metadata: Metadata = metadataForPublicPage("waiver");

export default function WaiverPage() {
  return <LegalDocumentView document={getLegalDocument("waiver")} />;
}
