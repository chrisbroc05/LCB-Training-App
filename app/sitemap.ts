import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/public-app-url";

const PUBLIC_PATHS = [
  "",
  "/coach",
  "/resources",
  "/program",
  "/remote",
  "/playbook",
  "/quiz",
  "/fix-it",
  "/terms",
  "/privacy",
  "/waiver",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
