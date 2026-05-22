"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
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
  { href: "/watchlist", label: "Parsel Alarm", icon: Bell },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/login", label: "Giriş", icon: LogIn },
  { href: "/register", label: "Kayıt", icon: UserPlus },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/95 px-4 backdrop-blur md:hidden">
        <span onClick={() => setMobileOpen(false)}>
          <BrandMark inverted />
        </span>
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
                      ? "bg-[#fffaf0] text-[#17231f]"
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

      <aside className="fixed left-0 top-0 z-50 hidden h-[100dvh] w-72 flex-col border-r border-[var(--border-subtle)] bg-[radial-gradient(circle_at_20%_0%,rgba(8,125,127,0.18),transparent_34%),var(--bg-card)] md:flex">
        <div className="border-b border-[var(--border-subtle)] p-4">
          <BrandMark inverted />
          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d9a441]">Resmi · Premium · Kolay</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Tapu güveni, sakin harita hissi ve vatandaş dostu kullanım.</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-3 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isActive
                    ? "bg-[#fffaf0] text-[#17231f] shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
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
          <p className="font-bold text-[#fffaf0]">eimar Beta</p>
          <p className="mt-1">Kadastro • Plan • Rapor</p>
        </div>
      </aside>
    </>
  );
}
