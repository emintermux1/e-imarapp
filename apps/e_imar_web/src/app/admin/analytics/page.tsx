import { BarChart3 } from "lucide-react";
import { AdminMetric, AdminShell } from "@/components/admin/admin-shell";
import { adminReports, adminUsers, sourceSummary } from "@/components/admin/admin-data";

const funnels = [
  { label: "Ada/parsel sorgu", value: 1240, width: "100%" },
  { label: "Kaynak kontrolü", value: 982, width: "79%" },
  { label: "Rapor önizleme", value: 514, width: "41%" },
  { label: "Favoriye ekleme", value: 188, width: "15%" }
];

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="Analytics" eyebrow="Admin / analytics">
      <div className="grid gap-3 md:grid-cols-4">
        <AdminMetric label="Sorgu" value="1.240" detail="Son 30 gün demo metriği" tone="good" />
        <AdminMetric label="Rapor" value={String(adminReports.length)} detail="Kaynaklı çıktı" />
        <AdminMetric label="Watchlist" value={String(adminUsers.reduce((sum, user) => sum + user.watchedParcels, 0))} detail="Favori parsel" />
        <AdminMetric label="Kaynak" value={String(sourceSummary.total)} detail="Registry kapsamı" />
      </div>
      <section className="mt-4 rounded-[1.75rem] border border-border-subtle bg-surface-1 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-green" />
          <h2 className="font-black text-fg-primary">MVP funnel</h2>
        </div>
        <div className="mt-5 space-y-3">
          {funnels.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-fg-secondary">
                <span>{item.label}</span>
                <span className="tabular-nums">{item.value.toLocaleString("tr-TR")}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--accent-green)),rgb(var(--accent-blue)))]" style={{ width: item.width }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
