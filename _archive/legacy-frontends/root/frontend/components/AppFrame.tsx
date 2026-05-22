"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mapFirst = pathname === "/" || pathname === "/parsel";

  if (mapFirst) {
    return <main className="min-w-0 flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="min-w-0 flex-1 pt-14 transition-all duration-300 md:ml-64 md:pt-0">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
