import type { MetadataRoute } from "next";
import { isPreviewDeployment, readPublicSiteUrl } from "@/lib/public-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = readPublicSiteUrl();
  const preview = isPreviewDeployment();
  return {
    rules: {
      userAgent: "*",
      allow: preview ? undefined : "/",
      disallow: preview ? "/" : undefined
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
