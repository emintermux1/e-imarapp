import type { MetadataRoute } from "next";
import { readPublicSiteUrl } from "@/lib/public-config";

const routes = [
  { path: "/", priority: 1 },
  { path: "/kaynaklar", priority: 0.9 },
  { path: "/plan-notu", priority: 0.8 },
  { path: "/calisma-alani", priority: 0.8 },
  { path: "/emsal", priority: 0.7 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = readPublicSiteUrl();
  const lastModified = new Date("2026-05-21T00:00:00.000Z");
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority
  }));
}
