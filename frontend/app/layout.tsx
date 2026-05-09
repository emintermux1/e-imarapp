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
      <body className={`${outfit.className} antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 transition-all duration-300">
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
