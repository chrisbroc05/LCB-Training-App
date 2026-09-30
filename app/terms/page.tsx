import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-docs";

export default function TermsPage() {
  return <LegalDocumentView document={getLegalDocument("terms")} />;
}
