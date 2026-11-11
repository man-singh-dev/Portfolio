import type { MetadataRoute } from "next";
import site from "@/data/site.json";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, lastModified: site.generatedAt, changeFrequency: "daily", priority: 1 }];
}
