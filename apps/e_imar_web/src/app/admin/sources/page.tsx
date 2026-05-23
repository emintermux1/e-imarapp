import Link from "next/link";
import { AdminMetric, AdminShell, AdminTable } from "@/components/admin/admin-shell";
import { sourceSummary } from "@/components/admin/admin-data";
import { FALLBACK_SOURCES } from "@/data/generated/source-fixtures";
import { StatusBanner } from "@/components/product/status-banner";

export default function AdminSourcesPage() {
  return (
    <AdminShell title="Sources" eyebrow="Admin / sources">
      <div className="grid gap-3 md:grid-cols-4">
        <AdminMetric label="Toplam" value={String(sourceSummary.total)} detail="Registry kaydı" />
        <AdminMetric label="Public" value={String(sourceSummary.officialish)} detail="Açık erişim/public portal" tone="good" />
        <AdminMetric label="Korumalı" value={String(sourceSummary.protected)} detail="Credential/legal/captcha bekler" tone="warn" />
        <AdminMetric label="Belediye" value={String(sourceSummary.municipal)} detail="Municipal GIS sınıfı" />
      </div>
      <div className="mt-4"><StatusBanner compact /></div>
      <AdminTable>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <tr><th className="p-3">Kaynak</th><th>Kategori</th><th>Auth</th><th>Provider</th><th>Link</th></tr>
          </thead>
          <tbody>
            {FALLBACK_SOURCES.slice(0, 18).map((source) => (
              <tr key={source.id} className="border-t border-border-subtle">
                <td className="p-3"><div className="font-black text-fg-primary">{source.name}</div><div className="max-w-xl truncate text-xs text-fg-muted">{source.notes}</div></td>
                <td>{source.category}</td>
                <td><span className="rounded-full bg-surface-2 px-2 py-1 text-xs font-bold">{source.auth}</span></td>
                <td>{source.provider}</td>
                <td>{source.base_url && <Link className="font-bold text-brand-blue hover:underline" href={source.base_url}>Aç</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </AdminShell>
  );
}
