import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sourceSans = Source_Sans_3({
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
    "Türkiye genelinde parsel, imar planı ve cadastral verilere modern bir arayüz.",
  applicationName: "E-İmar",
  authors: [{ name: "E-İmar Platform" }],
  formatDetection: { telephone: false },
  manifest: undefined
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" }
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
