import { Activity, Database, FileText, Users } from "lucide-react";
import { AdminMetric, AdminShell } from "@/components/admin/admin-shell";
import { adminReports, adminUsers, sourceSummary, subscriptionAccount } from "@/components/admin/admin-data";
import { StatusBanner } from "@/components/product/status-banner";
import { ReportActionPanel } from "@/components/product/report-action-panel";

export default function AdminDashboardPage() {
  const readyReports = adminReports.filter((report) => report.status === "ready").length;
  const activeUsers = adminUsers.filter((user) => user.status === "active").length;

  return (
    <AdminShell title="Operasyon dashboard" eyebrow="Admin / dashboard">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Aktif kullanıcı" value={String(activeUsers)} detail={`${adminUsers.length} toplam kullanıcı`} tone="good" />
        <AdminMetric label="Kaynak registry" value={String(sourceSummary.total)} detail={`${sourceSummary.protected} korumalı / izinli kaynak`} />
        <AdminMetric label="Hazır rapor" value={String(readyReports)} detail={`${adminReports.length} son rapor içinde`} tone="good" />
        <AdminMetric label="Paket" value={subscriptionAccount.plan.toUpperCase()} detail={`${subscriptionAccount.seats} koltuk · ${subscriptionAccount.watchlistLimit} favori parsel`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StatusBanner />
        <ReportActionPanel parcelLabel={adminReports[0]?.parcel ?? "Örnek parsel"} sourceCount={sourceSummary.officialish} generatedAt={adminReports[0]?.generatedAt} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          { icon: Users, title: "Erişim kontrolü", body: "Owner/admin/analyst/viewer rolleri aynı tablo ve validasyon kontratıyla yönetilir." },
          { icon: Database, title: "Kaynak güven skoru", body: "Official, public metadata, protected ve unavailable durumları kullanıcıya ayrı gösterilir." },
          { icon: FileText, title: "Rapor kuyruğu", body: "Raporlar kaynak linki, son kontrol tarihi ve resmi belge uyarısıyla saklanır." }
        ].map((item) => (
          <article key={item.title} className="rounded-[1.5rem] border border-border-subtle bg-surface-1 p-4">
            <item.icon className="h-5 w-5 text-brand-green" />
            <h2 className="mt-3 font-black text-fg-primary">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-secondary">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-border-subtle bg-surface-1 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-fg-primary">
          <Activity className="h-4 w-4 text-brand-green" />
          MVP sinyali
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
          Admin yüzeyi artık gerçek ürün odağını destekliyor: 5 belediye / resmi kaynak durumu / ada-parsel sonucu / kaynaklı rapor. Türkiye geneli sihirli platform masalını şimdilik kilitledik.
        </p>
      </div>
    </AdminShell>
  );
}
