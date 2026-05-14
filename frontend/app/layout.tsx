import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

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
  title: "eImarTR — Türkiye Ulusal e-İmar Platformu",
  description: "Parsel, imar planı, 3D simülasyon, uydu analizi ve raporlama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className={`${outfit.className} min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased`}>
        <div className="flex min-h-[100dvh]">
          <Sidebar />
          <main className="flex-1 pt-14 transition-all duration-300 md:ml-64 md:pt-0">
            <div className="mx-auto max-w-7xl p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
