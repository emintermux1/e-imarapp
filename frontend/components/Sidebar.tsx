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
  ChevronLeft,
  ChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-[var(--accent-cyan)]">e</span>Imar<span className="text-[var(--accent-magenta)]">TR</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/5 text-[var(--text-secondary)]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <p>v0.1.0 — Beta</p>
        </div>
      )}
    </aside>
  );
}
