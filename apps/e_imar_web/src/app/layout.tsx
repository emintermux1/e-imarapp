import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { readPublicSiteUrl } from "@/lib/public-config";

const sourceSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL(readPublicSiteUrl()),
  title: {
    default: "E-İmar · Türkiye Parsel Sorgu",
    template: "%s · E-İmar"
  },
  description:
    "Türkiye genelinde parsel, imar planı, kaynak durumu ve harita analizleri için map-first arayüz.",
  applicationName: "E-İmar",
  authors: [{ name: "E-İmar Platform" }],
  keywords: ["e-imar", "parsel sorgu", "imar planı", "Türkiye GIS", "TKGM", "belediye imar"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "E-İmar",
    title: "E-İmar · Türkiye Parsel Sorgu",
    description:
      "Türkiye genelinde parsel, imar planı, kaynak durumu ve harita analizleri için map-first arayüz.",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: "E-İmar · Türkiye Parsel Sorgu",
    description:
      "Türkiye genelinde parsel, imar planı, kaynak durumu ve harita analizleri için map-first arayüz.",
    images: ["/opengraph-image"]
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFF5EE" },
    { media: "(prefers-color-scheme: dark)", color: "#06140E" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={sourceSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-bg text-fg-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
