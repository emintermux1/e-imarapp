import Link from "next/link";
import { BarChart3, Database, FileText, LayoutDashboard, RadioTower, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sources", label: "Sources", icon: Database },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function AdminShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="h-full overflow-auto px-4 pb-8 pt-24 lg:pl-[6.5rem] xl:pl-[21rem]">
        <main className="mx-auto max-w-[1420px] space-y-4">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-surface-2/95 shadow-[0_28px_90px_-58px_rgb(var(--accent-navy)/0.8)]">
            <header className="border-b border-border-subtle bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-green)/0.18),transparent_34%),rgb(var(--surface-1)/0.76)] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--accent-navy))] text-white">
                    <RadioTower className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-green">{eyebrow ?? "Admin"}</p>
                    <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-fg-primary">{title}</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-secondary">
                      Operasyon paneli: kaynak sağlığı, kullanıcı erişimi, rapor çıktıları ve MVP metrikleri tek yüzeyde.
                    </p>
                  </div>
                </div>
                <nav className="flex flex-wrap gap-2">
                  {nav.map((item) => (
                    <Link key={item.href} href={item.href} className="inline-flex h-9 items-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-3 text-xs font-black text-fg-primary hover:bg-white">
                      <item.icon className="h-3.5 w-3.5 text-brand-green" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
            <div className="p-5">{children}</div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}

export function AdminMetric({ label, value, detail, tone = "default" }: { label: string; value: string; detail: string; tone?: "default" | "good" | "warn" }) {
  return (
    <div className={cn("rounded-[1.5rem] border p-4", tone === "good" ? "border-status-success/25 bg-status-success/10" : tone === "warn" ? "border-status-warning/25 bg-status-warning/10" : "border-border-subtle bg-surface-1")}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted">{label}</p>
      <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-fg-primary">{value}</div>
      <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{detail}</p>
    </div>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-[1.5rem] border border-border-subtle bg-surface-1">{children}</div>;
}
