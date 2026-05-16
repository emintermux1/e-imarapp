import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-outfit"
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "eimar — Parsel zekası ve imar haritası",
  description: "Resmi veri güvenini modern harita deneyimiyle birleştiren parsel, imar planı, 3D simülasyon ve raporlama platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className={`${outfit.className} brand-grain min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased`}>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
