import type { Metadata } from "next";
import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-docs";
import { metadataForPublicPage } from "@/lib/public-seo";

export const metadata: Metadata = metadataForPublicPage("privacy");

export default function PrivacyPage() {
  return <LegalDocumentView document={getLegalDocument("privacy")} />;
}
