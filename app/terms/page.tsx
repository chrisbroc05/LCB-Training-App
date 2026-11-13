import type { Metadata } from "next";
import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-docs";
import { metadataForPublicPage } from "@/lib/public-seo";

export const metadata: Metadata = metadataForPublicPage("terms");

export default function TermsPage() {
  return <LegalDocumentView document={getLegalDocument("terms")} />;
}
