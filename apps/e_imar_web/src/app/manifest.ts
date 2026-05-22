import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-İmar · Türkiye Parsel Sorgu",
    short_name: "E-İmar",
    description: "Türkiye genelinde parsel, imar planı, kaynak durumu ve harita analizleri için map-first arayüz.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eff5ee",
    theme_color: "#0f2d22",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
