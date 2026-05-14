"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Search,
  FileText,
  Link2,
  Building2,
  Globe,
  BarChart3,
  Bell,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Layers,
  Satellite,
  Home,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/map", label: "Harita", icon: Map },
  { href: "/parsel", label: "Parsel Ara", icon: Search },
  { href: "/plans", label: "İmar Planları", icon: Layers },
  { href: "/municipalities", label: "Belediyeler", icon: Building2 },
  { href: "/simulation", label: "3D Simülasyon", icon: Globe },
  { href: "/satellite", label: "Uydu Analizi", icon: Satellite },
  { href: "/analysis", label: "Analiz", icon: BarChart3 },
  { href: "/reports", label: "Raporlar", icon: FileText },
  { href: "/sources", label: "Kaynak Önizleme", icon: Link2 },
  { href: "/watchlist", label: "İzleme Listesi", icon: Bell },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/login", label: "Giriş", icon: LogIn },
  { href: "/register", label: "Kayıt", icon: UserPlus },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="text-lg font-bold tracking-tight" onClick={() => setMobileOpen(false)}>
          <span className="text-[var(--accent-cyan)]">e</span> imar
        </Link>
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-xl border border-[var(--border-subtle)] p-2 text-[var(--text-primary)]"
          aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 pt-14 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)}>
          <nav className="mx-3 mt-3 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-50 hidden h-[100dvh] w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-card)] md:flex">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
          <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-[var(--accent-cyan)]">e</span> imar
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-2 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-4 text-xs text-[var(--text-secondary)]">
          <p>v0.1.0 — Beta</p>
        </div>
      </aside>
    </>
  );
}
