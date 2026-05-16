import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sourceSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: {
    default: "E-İmar · Türkiye Parsel Sorgu",
    template: "%s · E-İmar"
  },
  description:
    "Türkiye genelinde parsel, imar planı, kaynak durumu ve harita analizleri için map-first arayüz.",
  applicationName: "E-İmar",
  authors: [{ name: "E-İmar Platform" }],
  formatDetection: { telephone: false },
  manifest: undefined
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
