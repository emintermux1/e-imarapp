import { AdminMetric, AdminShell, AdminSourceLabel, AdminStatePanel, AdminTable } from "@/components/admin/admin-shell";
import { adminReports } from "@/components/admin/admin-data";
import { ReportActionPanel } from "@/components/product/report-action-panel";

export default function AdminReportsPage() {
  const hasReports = adminReports.length > 0;

  return (
    <AdminShell title="Reports" eyebrow="Admin / reports">
      <div className="grid gap-3 md:grid-cols-3">
        <AdminMetric label="Hazır" value={String(adminReports.filter((r) => r.status === "ready").length)} detail="Kaynak linkli çıktı" tone="good" />
        <AdminMetric label="Taslak" value={String(adminReports.filter((r) => r.status === "draft").length)} detail="Kullanıcı aksiyonu bekler" />
        <AdminMetric label="Blokaj" value={String(adminReports.filter((r) => r.status === "blocked").length)} detail="Korumalı kaynak/kontrat" tone="warn" />
      </div>
      <div className="mt-4"><ReportActionPanel parcelLabel={adminReports[0]?.parcel} sourceCount={adminReports[0]?.sourceCount} generatedAt={adminReports[0]?.generatedAt} /></div>
      <AdminTable title="Rapor kuyruğu" description="Demo kayıt, registry kaynak sayısı ve canlı üretim ayrımı tablo içinde açık tutulur." state={hasReports ? "ready" : "empty"}>
        {hasReports ? (
        <table className="admin-responsive-table w-full text-left text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <tr><th className="p-3">Rapor</th><th>Parsel</th><th>Sahip</th><th>Kaynak</th><th>Etiket</th><th>Durum</th><th>Tarih</th></tr>
          </thead>
          <tbody>
            {adminReports.map((report) => (
              <tr key={report.id} className="border-t border-border-subtle">
                <td data-label="Rapor" className="p-3 font-black text-fg-primary">{report.id}</td>
                <td data-label="Parsel">{report.parcel}</td>
                <td data-label="Sahip">{report.owner}</td>
                <td data-label="Kaynak" className="tabular-nums">{report.sourceCount}</td>
                <td data-label="Etiket"><AdminSourceLabel status={report.status === "ready" ? "computed" : report.status === "blocked" ? "not_ready" : "demo"} label={report.status === "ready" ? "Üretilmiş" : report.status === "blocked" ? "Blokaj" : "Demo taslak"} /></td>
                <td data-label="Durum"><span className="rounded-full bg-surface-2 px-2 py-1 text-xs font-bold">{report.status}</span></td>
                <td data-label="Tarih" className="text-fg-muted">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(report.generatedAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <AdminStatePanel state="empty" title="Rapor kuyruğu boş" detail="Henüz kaynaklı rapor üretilmedi; demo kayıt varsa resmi belge gibi sunulmaz." />
        )}
      </AdminTable>
    </AdminShell>
  );
}
