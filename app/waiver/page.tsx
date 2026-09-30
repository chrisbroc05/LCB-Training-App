import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-docs";

export default function WaiverPage() {
  return <LegalDocumentView document={getLegalDocument("waiver")} />;
}
