"use client";

import { useUiStore } from "@/store/ui-store";
import Link from "next/link";

export function TopBar() {
  const is3DMode = useUiStore((s) => s.is3DMode);
  const toggle3DMode = useUiStore((s) => s.toggle3DMode);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center gap-3 px-4">
        <div className="min-w-[220px]">
          <p className="text-xs tracking-widest text-slate-500">TÜRKİYE E-İMAR</p>
          <p className="text-lg font-semibold text-slate-900">GIS Workspace</p>
        </div>
        <input
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
          placeholder="Ada / Parsel, koordinat, adres, belediye ile ara..."
        />
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Yeni Sorgu</button>
        <Link href="/watchlist" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Watchlist</Link>
        <Link href="/reports" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Rapor</Link>
        <button
          onClick={() => toggle3DMode()}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          {is3DMode ? "2D Mod" : "3D Mod"}
        </button>
      </div>
    </header>
  );
}
