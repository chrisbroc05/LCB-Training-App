import type { Metadata } from "next";
import { metadataForPublicPage } from "@/lib/public-seo";

export const HOMEPAGE_TITLE = "Work Hard. Be Memorable. | LCB Training";

export const HOMEPAGE_DESCRIPTION =
  "Daily plans and personal swing feedback from Coach Broc for youth, high school, and college baseball and softball players.";

export function buildHomepageMetadata(): Metadata {
  return metadataForPublicPage("home");
}
