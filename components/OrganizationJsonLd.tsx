import {
  ORGANIZATION_FOUNDER_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO_PATH,
  absolutePublicUrl,
  getCanonicalSiteOrigin,
} from "@/lib/public-seo";
import { LCB_INSTAGRAM_URL, LCB_TIKTOK_URL } from "@/lib/social-links";

export default function OrganizationJsonLd() {
  const siteUrl = getCanonicalSiteOrigin();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_LEGAL_NAME,
    url: siteUrl,
    logo: absolutePublicUrl(ORGANIZATION_LOGO_PATH),
    founder: {
      "@type": "Person",
      name: ORGANIZATION_FOUNDER_NAME,
    },
    sameAs: [LCB_INSTAGRAM_URL, LCB_TIKTOK_URL],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
    />
  );
}
