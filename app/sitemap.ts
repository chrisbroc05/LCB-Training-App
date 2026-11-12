import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/public-app-url";

type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

/** Priority order: home, then program / swing / resources / playbook near the top. */
const PUBLIC_ENTRIES: SitemapEntry[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/program", priority: 0.95, changeFrequency: "weekly" },
  { path: "/swing-analysis", priority: 0.9, changeFrequency: "weekly" },
  { path: "/resources", priority: 0.9, changeFrequency: "weekly" },
  { path: "/playbook", priority: 0.9, changeFrequency: "weekly" },
  { path: "/coach", priority: 0.8, changeFrequency: "monthly" },
  { path: "/remote", priority: 0.8, changeFrequency: "monthly" },
  { path: "/fix-it", priority: 0.75, changeFrequency: "monthly" },
  { path: "/free/rotate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/free/mobility", priority: 0.7, changeFrequency: "monthly" },
  { path: "/quiz", priority: 0.6, changeFrequency: "monthly" },
  { path: "/llms.txt", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/waiver", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();
  const lastModified = new Date();

  return PUBLIC_ENTRIES.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
